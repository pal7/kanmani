import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { createUserSupabaseClient } from '../db/supabase.js';
import { insertChat, updateChatTitle } from '../db/repositories/chats.js';
import {
  insertUserMessage,
  insertAssistantMessage,
  getMessagesByChat,
} from '../db/repositories/messages.js';
import { buildContext } from '../ai/contextBuilder.js';
import { streamCompletion } from '../ai/foundryClient.js';
import { routeModel } from '../ai/modelRouter.js';
import { generateTitle } from '../ai/titleGenerator.js';
import { estimateTokens } from '../lib/tokens.js';
import logger from '../lib/logger.js';

const router = Router();

const streamBodySchema = z.object({
  chatId: z.string().uuid().nullable(),
  message: z.string().min(1).max(10_000),
  language: z.enum(['en', 'ta']),
});

// POST /api/chat/stream
// Opens an SSE stream. Emits: meta → delta* → done | error.
// Handles: client disconnect, Azure errors mid-stream, malformed requests.
router.post('/stream', authMiddleware, chatRateLimit, async (req, res) => {
  // ── 1. Validate request body before touching SSE headers ──────────────────
  const parsed = streamBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', issues: parsed.error.issues });
    return;
  }

  const { chatId, message, language } = parsed.data;
  const userId = req.user.id;
  const accessToken = req.headers.authorization!.slice(7); // strip 'Bearer '

  // ── 2. Open SSE connection ─────────────────────────────────────────────────
  // Headers must be set and flushed before any write(). After this point we
  // can no longer change the HTTP status — errors go through `event: error`.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Disable nginx/Azure proxy buffering so deltas reach the client immediately.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const write = (event: string, data: unknown): void => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // ── 3. Disconnect guard ───────────────────────────────────────────────────
  // req.on('close') fires when the client navigates away or drops the
  // connection. We abort the Azure stream immediately so we stop paying for
  // tokens the user will never see.
  let clientGone = false;
  const abort = new AbortController();
  req.on('close', () => {
    clientGone = true;
    abort.abort();
    logger.debug({ userId, chatId }, 'SSE client disconnected mid-stream');
  });

  const supabase = createUserSupabaseClient(accessToken);

  try {
    // ── 4. Resolve or create the chat ────────────────────────────────────────
    const isNewChat = chatId === null;
    const deployment = routeModel(language);

    let resolvedChatId: string;
    if (isNewChat) {
      const chat = await insertChat(supabase, { userId, language, model: deployment });
      resolvedChatId = chat.id;
    } else {
      resolvedChatId = chatId;
    }

    // ── 5. Persist the user's message ────────────────────────────────────────
    await insertUserMessage(supabase, { chatId: resolvedChatId, content: message });

    // ── 6. Load history & build context window ───────────────────────────────
    // History is fetched after saving so the current message is included.
    const history = await getMessagesByChat(supabase, resolvedChatId);
    const { messages: contextMessages, totalTokens, truncated } = buildContext(history, language);

    if (truncated) {
      logger.debug({ chatId: resolvedChatId, language }, 'History truncated to fit context window');
    }

    // ── 7. Send meta event ───────────────────────────────────────────────────
    // Pre-generate the assistant message ID so the client can track it.
    const assistantMessageId = crypto.randomUUID();
    write('meta', { chatId: resolvedChatId, messageId: assistantMessageId, model: deployment });

    // ── 8. Stream tokens from Azure Foundry ──────────────────────────────────
    let assistantContent = '';

    for await (const token of streamCompletion(deployment, contextMessages, {
      abortSignal: abort.signal,
    })) {
      if (clientGone) break;
      assistantContent += token;
      write('delta', { text: token });
    }

    // Client left while we were streaming — nothing more to do.
    if (clientGone) return;

    // ── 9. Persist the completed assistant message ───────────────────────────
    const tokensOut = estimateTokens(assistantContent);
    await insertAssistantMessage(supabase, {
      id: assistantMessageId,
      chatId: resolvedChatId,
      content: assistantContent,
      tokensIn: totalTokens,
      tokensOut,
    });

    // ── 10. Title generation (fire-and-forget for new chats) ─────────────────
    // We don't await this — the client already has the chatId and doesn't need
    // the title to finish the streaming flow. If it fails, the chat title
    // stays null and can be set on next load.
    if (isNewChat) {
      generateTitle(message, language)
        .then((title) => updateChatTitle(supabase, resolvedChatId, title))
        .catch((err) =>
          logger.warn({ err, chatId: resolvedChatId }, 'Background title generation failed'),
        );
    }

    // ── 11. Done ─────────────────────────────────────────────────────────────
    write('done', { tokens_in: totalTokens, tokens_out: tokensOut });

  } catch (err) {
    if (clientGone) return;

    // AbortError means we triggered the abort ourselves on disconnect.
    // That path is already handled above, but guard here for safety.
    const isAbortError = err instanceof Error && err.name === 'AbortError';
    if (!isAbortError) {
      logger.error({ err, userId }, 'SSE stream error');
      write('error', {
        code: 'STREAM_ERROR',
        message: err instanceof Error ? err.message : 'Streaming failed',
      });
    }
  } finally {
    res.end();
  }
});

export default router;
