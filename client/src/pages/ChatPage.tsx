import { useCallback } from 'react';
import ChatWindow from '../components/ChatWindow.js';
import InputBar from '../components/InputBar.js';
import Sidebar from '../components/Sidebar.js';
import LanguageToggle from '../components/LanguageToggle.js';
import BrandMark from '../components/BrandMark.js';
import { useUIStore } from '../stores/uiStore.js';
import { useChat } from '../hooks/useChat.js';
import { useAuth } from '../hooks/useAuth.js';
import { useT } from '../i18n/index.js';

export default function ChatPage() {
  const { toggleSidebar } = useUIStore();
  const { sendMessage } = useChat();
  const { signOut } = useAuth();
  const t = useT();

  const handleSend = useCallback((text: string) => sendMessage(text), [sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-bg">
      <Sidebar />
      <header className="flex items-center justify-between px-4 py-3 border-b border-accent-soft bg-bg shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="text-muted hover:text-ink transition-colors" aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <BrandMark className="text-xl" />
          <span className="font-display text-lg text-ink hidden sm:inline">கண்மணி</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button onClick={signOut} className="text-xs text-muted hover:text-ink transition-colors">{t.signOut}</button>
        </div>
      </header>
      <ChatWindow onSuggestion={handleSend} />
      <InputBar onSend={handleSend} />
    </div>
  );
}
