import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createUserSupabaseClient } from '../db/supabase.js';
import {
  getUserChats,
  getChatById,
  deleteChatById,
} from '../db/repositories/chats.js';
import { getMessagesByChat } from '../db/repositories/messages.js';

const router = Router();

// All /api/chats routes require a valid Supabase JWT.
// RLS on the database enforces ownership — these routes don't need additional
// ownership checks beyond providing the correct user client.
router.use(authMiddleware);

// GET /api/chats — list caller's chats, newest first
router.get('/', async (req, res, next) => {
  try {
    const supabase = createUserSupabaseClient(req.headers.authorization!.slice(7));
    const chats = await getUserChats(supabase, req.user.id);
    res.json(chats);
  } catch (err) {
    next(err);
  }
});

// GET /api/chats/:id — chat metadata + all messages
router.get('/:id', async (req, res, next) => {
  try {
    const chatId = req.params['id'] as string;
    const supabase = createUserSupabaseClient(req.headers.authorization!.slice(7));

    const chat = await getChatById(supabase, chatId);
    if (!chat) {
      // RLS returns null (not an error) when the chat doesn't exist or belongs
      // to another user — both cases surface as 404.
      res.status(404).json({ error: 'Chat not found', code: 'NOT_FOUND' });
      return;
    }

    const messages = await getMessagesByChat(supabase, chatId);
    res.json({ ...chat, messages });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chats/:id — cascade deletes messages via FK constraint
router.delete('/:id', async (req, res, next) => {
  try {
    const chatId = req.params['id'] as string;
    const supabase = createUserSupabaseClient(req.headers.authorization!.slice(7));
    await deleteChatById(supabase, chatId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
