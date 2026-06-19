import type { Chat, Message } from '../stores/chatStore.js';

const apiBase = import.meta.env.VITE_API_BASE_URL as string;

async function authHeader(): Promise<string> {
  const { supabase } = await import('./supabase.js');
  const { data } = await supabase.auth.getSession();
  return data.session ? `Bearer ${data.session.access_token}` : '';
}

export interface StreamCallbacks {
  onMeta?: (d: { chatId: string; messageId: string; model: string }) => void;
  onDelta?: (text: string) => void;
  onDone?: (d: { tokens_in: number; tokens_out: number }) => void;
  onError?: (e: { code: string; message: string }) => void;
}

export async function streamChat(
  payload: { chatId: string | null; message: string; language: 'en' | 'ta' },
  cb: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`${apiBase}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: await authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) { cb.onError?.({ code: 'http_error', message: `HTTP ${res.status}` }); return; }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    let event = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) { event = line.slice(7).trim(); }
      else if (line.startsWith('data: ')) {
        const d = JSON.parse(line.slice(6));
        if (event === 'meta') cb.onMeta?.(d);
        else if (event === 'delta') cb.onDelta?.(d.text);
        else if (event === 'done') cb.onDone?.(d);
        else if (event === 'error') cb.onError?.(d);
        event = '';
      }
    }
  }
}

export async function fetchChats(): Promise<Chat[]> {
  const res = await fetch(`${apiBase}/api/chats`, { headers: { Authorization: await authHeader() } });
  return res.ok ? res.json() : [];
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${apiBase}/api/chats/${chatId}`, { headers: { Authorization: await authHeader() } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages ?? [];
}

export async function deleteChat(chatId: string): Promise<void> {
  await fetch(`${apiBase}/api/chats/${chatId}`, { method: 'DELETE', headers: { Authorization: await authHeader() } });
}
