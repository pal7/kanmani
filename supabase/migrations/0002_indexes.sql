-- Migration: 0002_indexes
-- Performance indexes. Separated from 0001_init so the base schema is readable
-- on its own and index strategy can be reasoned about independently.

-- ---------------------------------------------------------------------------
-- messages(chat_id, created_at)
-- ---------------------------------------------------------------------------
-- Used by: GET /api/chats/:id, which fetches all messages for a chat in
-- chronological order. Without this index, loading a chat with 100+ messages
-- does a sequential scan of the entire messages table filtered by chat_id.
-- The composite index satisfies both the equality filter (chat_id = ?) and the
-- ORDER BY created_at in a single index scan — no separate sort step.
create index messages_chat_id_created_at
  on public.messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- chats(user_id, updated_at DESC)
-- ---------------------------------------------------------------------------
-- Used by: GET /api/chats, which lists a user's chats sorted by most-recent
-- activity. The DESC matches the query's ORDER BY updated_at DESC so Postgres
-- can satisfy the sort by reading the index forward without a filesort.
-- The RLS policy (auth.uid() = user_id) also benefits: Postgres can use this
-- index to quickly find only the current user's rows before applying RLS,
-- rather than scanning all chats and filtering post-RLS.
create index chats_user_id_updated_at
  on public.chats (user_id, updated_at desc);
