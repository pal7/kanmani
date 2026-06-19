import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { useUIStore } from '../stores/uiStore.js';
import MessageBubble from './MessageBubble.js';
import TypingIndicator from './TypingIndicator.js';
import SuggestionChips from './SuggestionChips.js';
import BrandMark from './BrandMark.js';
import { useT } from '../i18n/index.js';

interface Props { onSuggestion: (text: string) => void; }

export default function ChatWindow({ onSuggestion }: Props) {
  const { messages, streaming, streamingContent } = useChatStore();
  const language = useUIStore((s) => s.language);
  const t = useT();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
          <BrandMark className="text-6xl" />
          <p className={`text-muted text-sm max-w-xs ${language === 'ta' ? 'font-tamil' : ''}`}>
            {t.welcome}
          </p>
          <SuggestionChips onSelect={onSuggestion} language={language} />
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} lang={language} />
          ))}
          {streaming && (
            streamingContent
              ? <MessageBubble message={{ id: 'streaming', role: 'assistant', content: streamingContent, createdAt: '' }} lang={language} />
              : <TypingIndicator />
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
