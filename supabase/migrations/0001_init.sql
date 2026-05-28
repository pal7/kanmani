-- Migration: 0001_init
-- Creates the core tables for Kanmani and enables Row Level Security.
-- Every policy comment explains the threat it closes, not just what it does.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.chats (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text,
  language    text        not null check (language in ('en', 'ta')),
  model       text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Messages belong to a chat. Deleting a chat cascades to its messages so we
-- never leave orphaned message rows that would leak content without an owner.
create table public.messages (
  id          uuid        primary key default gen_random_uuid(),
  chat_id     uuid        not null references public.chats(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant', 'system')),
  content     text        not null,
  tokens_in   int,
  tokens_out  int,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- Enabling RLS on a table causes Postgres to deny ALL access by default until
-- a matching policy is found. This means a missing policy is a deny, not an
-- allow — the safe default. Application bugs that construct wrong queries
-- (e.g. a missing WHERE clause, or a SQL injection that neutralises the WHERE)
-- still cannot read another user's rows because the database enforces the check
-- independently of whatever SQL the application sent.

alter table public.chats    enable row level security;
alter table public.messages enable row level security;

-- ---------------------------------------------------------------------------
-- Policies: chats
-- ---------------------------------------------------------------------------

-- Guards against: an authenticated user querying another user's chat list.
-- Without this, a valid JWT from user A could fetch all rows in public.chats,
-- exposing the titles and language preferences of every user in the system.
create policy "users can read their own chats"
  on public.chats
  for select
  using (auth.uid() = user_id);

-- Guards against: a user inserting a chat row on behalf of another user_id,
-- or updating a chat they do not own (e.g. changing another user's title).
-- The WITH CHECK clause covers INSERT and UPDATE: it rejects any write where
-- the row being written would not satisfy the policy — so even if the
-- application accidentally omits the user_id assignment, the write is rejected.
create policy "users can write their own chats"
  on public.chats
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Policies: messages
-- ---------------------------------------------------------------------------

-- Guards against: reading messages from a chat the authenticated user does not
-- own. The sub-select through public.chats is necessary because messages do not
-- store user_id directly — ownership is via the parent chat. An attacker who
-- knows (or guesses) a chat UUID cannot read its messages unless they also own
-- that chat row.
create policy "users can read messages in their own chats"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.chats c
      where c.id = messages.chat_id
        and c.user_id = auth.uid()
    )
  );

-- Guards against: inserting messages into a chat owned by another user, or
-- updating/deleting messages in a chat the user does not own. The WITH CHECK
-- closes the same hole on the write path: even if the application sends an
-- INSERT with a chat_id that belongs to another user, Postgres rejects it.
-- This matters because the API layer receives chat_id from the client request
-- body — a malicious client could send any UUID.
create policy "users can write messages in their own chats"
  on public.messages
  for all
  using (
    exists (
      select 1
      from public.chats c
      where c.id = messages.chat_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.chats c
      where c.id = messages.chat_id
        and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

-- Keeps chats.updated_at current so the sidebar can sort by most-recent
-- activity. We update this on every new message insert rather than on chat
-- UPDATE, so the trigger fires on the messages table.

create or replace function public.touch_chat_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chats
  set updated_at = now()
  where id = new.chat_id;
  return new;
end;
$$;

create trigger messages_touch_chat_updated_at
  after insert on public.messages
  for each row
  execute function public.touch_chat_updated_at();
