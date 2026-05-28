import type { ChatRequestMessageUnion } from './foundryClient.js';
import { estimateTokens, historyBudget } from '../lib/tokens.js';
import { getSystemPromptContent } from './systemPrompts.js';
import type { Language } from './modelRouter.js';

export interface StoredMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ContextResult {
  messages: ChatRequestMessageUnion[];
  totalTokens: number;
  truncated: boolean;
}

/**
 * Builds the messages array to send to the model, respecting the token budget
 * for the given language. Always includes the system prompt. Older history is
 * dropped first; turns are never split.
 *
 * @param history  All stored messages for the chat, oldest-first, including
 *                 the current user message as the final entry.
 * @param language Determines both the system prompt and the token budget.
 */
export function buildContext(
  history: StoredMessage[],
  language: Language,
): ContextResult {
  const systemContent = getSystemPromptContent(language);
  const budget = historyBudget(language);

  const systemTokens = estimateTokens(systemContent);

  // How many tokens remain for history messages after reserving the system prompt.
  // We cap the system prompt at half the budget to avoid a runaway prompt
  // eating all the context in a future prompt-engineering iteration.
  const historyTokenBudget = Math.max(budget - systemTokens, Math.floor(budget / 2));

  // Walk history newest-to-oldest, accumulating token counts until the budget
  // is exhausted. We never split a turn — if a message doesn't fit, we stop
  // and everything older is discarded.
  let usedTokens = 0;
  const kept: StoredMessage[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg === undefined) continue;

    // Approximate overhead per message (role label + formatting)
    const msgTokens = estimateTokens(msg.content) + 4;

    if (usedTokens + msgTokens > historyTokenBudget) {
      // This message would exceed the budget. Stop — don't include it or
      // anything older. Splitting a turn (keeping assistant without its
      // preceding user message) would confuse the model about conversation state.
      break;
    }

    usedTokens += msgTokens;
    kept.unshift(msg);
  }

  const truncated = kept.length < history.length;

  const messages: ChatRequestMessageUnion[] = [
    { role: 'system', content: systemContent },
    ...kept.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  return {
    messages,
    totalTokens: systemTokens + usedTokens,
    truncated,
  };
}
