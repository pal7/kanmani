import { create } from 'zustand';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string | null;
  language: 'en' | 'ta';
  model: string;
  updatedAt: string;
}

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  streaming: boolean;
  streamingContent: string;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: string | null) => void;
  bindActiveChat: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (msg: Message) => void;
  setStreaming: (v: boolean) => void;
  addUserMessage: (msg: Message) => void;
  deleteChat: (id: string) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  streaming: false,
  streamingContent: '',
  setChats: (chats) => set({ chats }),
  setActiveChat: (id) => set({ activeChatId: id, messages: [], streamingContent: '' }),
  // Binds the chat id mid-stream (e.g. when the server creates the chat on
  // first send) without clearing the messages already on screen.
  bindActiveChat: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
  appendStreamChunk: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  finalizeStream: (msg) => set((s) => ({
    messages: [...s.messages, msg],
    streaming: false,
    streamingContent: '',
  })),
  setStreaming: (streaming) => set({ streaming }),
  addUserMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  deleteChat: (id) => set((s) => ({
    chats: s.chats.filter((c) => c.id !== id),
    activeChatId: s.activeChatId === id ? null : s.activeChatId,
    messages: s.activeChatId === id ? [] : s.messages,
  })),
}));
