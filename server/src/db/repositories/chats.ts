import type { UserSupabaseClient } from '../supabase.js';
import type { Language } from '../../ai/modelRouter.js';
import { ApiError } from '../../middleware/error.js';

export interface Chat {
  id: string;
  userId: string;
  title: string | null;
  language: Language;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatRow {
  id: string;
  user_id: string;
  title: string | null;
  language: string;
  model: string;
  created_at: string;
  updated_at: string;
}

function mapChat(row: ChatRow): Chat {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    language: row.language as Language,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertChat(
  supabase: UserSupabaseClient,
  data: { userId: string; language: Language; model: string },
): Promise<Chat> {
  const { data: row, error } = await supabase
    .from('chats')
    .insert({ user_id: data.userId, language: data.language, model: data.model })
    .select()
    .single<ChatRow>();

  if (error) throw new ApiError(500, 'Failed to create chat', 'DB_ERROR');
  return mapChat(row);
}

export async function getUserChats(
  supabase: UserSupabaseClient,
  _userId: string,
): Promise<Chat[]> {
  // RLS handles the user_id filter; the _userId param is accepted for
  // call-site clarity but the policy enforces it at the DB layer.
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false })
    .returns<ChatRow[]>();

  if (error) throw new ApiError(500, 'Failed to list chats', 'DB_ERROR');
  return (data ?? []).map(mapChat);
}

export async function getChatById(
  supabase: UserSupabaseClient,
  chatId: string,
): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle<ChatRow>();

  if (error) throw new ApiError(500, 'Failed to fetch chat', 'DB_ERROR');
  return data ? mapChat(data) : null;
}

export async function deleteChatById(
  supabase: UserSupabaseClient,
  chatId: string,
): Promise<void> {
  const { error } = await supabase.from('chats').delete().eq('id', chatId);
  if (error) throw new ApiError(500, 'Failed to delete chat', 'DB_ERROR');
}

export async function updateChatTitle(
  supabase: UserSupabaseClient,
  chatId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId);
  if (error) throw new ApiError(500, 'Failed to update chat title', 'DB_ERROR');
}
