import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { streamChat, fetchChats, fetchMessages, deleteChat as apiDeleteChat } from '../lib/api.js';
import type { Message } from '../stores/chatStore.js';

export function useChat() {
  const store = useChatStore();
  const language = useUIStore((s) => s.language);

  const loadChats = useCallback(async () => {
    const chats = await fetchChats();
    store.setChats(chats);
  }, [store]);

  const openChat = useCallback(async (chatId: string) => {
    store.setActiveChat(chatId);
    const messages = await fetchMessages(chatId);
    store.setMessages(messages);
  }, [store]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    store.addUserMessage(userMsg);
    store.setStreaming(true);

    await streamChat(
      { chatId: store.activeChatId, message: text, language },
      {
        onMeta: ({ chatId }) => store.bindActiveChat(chatId),
        onDelta: (chunk) => store.appendStreamChunk(chunk),
        onDone: () => {
          const content = useChatStore.getState().streamingContent;
          store.finalizeStream({
            id: crypto.randomUUID(),
            role: 'assistant',
            content,
            createdAt: new Date().toISOString(),
          });
          loadChats();
        },
        onError: (err) => {
          console.error('Stream error', err);
          store.setStreaming(false);
        },
      },
    );
  }, [store, language, loadChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    await apiDeleteChat(chatId);
    store.deleteChat(chatId);
  }, [store]);

  return { loadChats, openChat, sendMessage, deleteChat };
}
