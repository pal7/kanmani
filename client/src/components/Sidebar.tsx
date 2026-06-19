import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { useChat } from '../hooks/useChat.js';
import { useT } from '../i18n/index.js';
import BrandMark from './BrandMark.js';

export default function Sidebar() {
  const { chats, activeChatId } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { loadChats, openChat, deleteChat } = useChat();
  const t = useT();

  useEffect(() => { loadChats(); }, []);

  if (!sidebarOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-ink/20 z-20" onClick={toggleSidebar} />
      <aside className="fixed left-0 top-0 h-full w-72 bg-bg border-r border-accent-soft z-30 flex flex-col shadow-soft">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-accent-soft">
          <BrandMark className="text-2xl" />
          <span className="font-display text-lg text-ink">கண்மணி</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {chats.length === 0
            ? <p className="text-muted text-sm text-center py-8">{t.noChats}</p>
            : chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { openChat(chat.id); toggleSidebar(); }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent-soft/50 transition-colors group ${activeChatId === chat.id ? 'bg-accent-soft' : ''}`}
              >
                <span className="text-sm text-ink truncate flex-1">
                  {chat.title ?? t.newConversation}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-accent transition-opacity ml-2 shrink-0"
                  aria-label="Delete chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            ))
          }
        </div>
      </aside>
    </>
  );
}
