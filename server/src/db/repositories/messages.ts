import type { UserSupabaseClient } from '../supabase.js';
import { ApiError } from '../../middleware/error.js';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string;
}

interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    role: row.role as MessageRole,
    content: row.content,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    createdAt: row.created_at,
  };
}

export async function getMessagesByChat(
  supabase: UserSupabaseClient,
  chatId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .returns<MessageRow[]>();

  if (error) throw new ApiError(500, 'Failed to fetch messages', 'DB_ERROR');
  return (data ?? []).map(mapMessage);
}

export async function insertUserMessage(
  supabase: UserSupabaseClient,
  data: { chatId: string; content: string },
): Promise<Message> {
  const { data: row, error } = await supabase
    .from('messages')
    .insert({ chat_id: data.chatId, role: 'user', content: data.content })
    .select()
    .single<MessageRow>();

  if (error) throw new ApiError(500, 'Failed to save message', 'DB_ERROR');
  return mapMessage(row);
}

export async function insertAssistantMessage(
  supabase: UserSupabaseClient,
  data: {
    id: string;
    chatId: string;
    content: string;
    tokensIn: number;
    tokensOut: number;
  },
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    id: data.id,
    chat_id: data.chatId,
    role: 'assistant',
    content: data.content,
    tokens_in: data.tokensIn,
    tokens_out: data.tokensOut,
  });
  if (error) throw new ApiError(500, 'Failed to save assistant message', 'DB_ERROR');
}
