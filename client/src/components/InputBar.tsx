import { useState, useRef } from 'react';
import { useChatStore } from '../stores/chatStore.js';
import { useT } from '../i18n/index.js';
import { useUIStore } from '../stores/uiStore.js';

interface Props { onSend: (text: string) => void; }

export default function InputBar({ onSend }: Props) {
  const [value, setValue] = useState('');
  const streaming = useChatStore((s) => s.streaming);
  const language = useUIStore((s) => s.language);
  const t = useT();
  const ref = useRef<HTMLTextAreaElement>(null);

  function send() {
    const text = value.trim();
    if (!text || streaming) return;
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
    onSend(text);
  }

  return (
    <div className="border-t border-accent-soft bg-bg px-4 py-3 shrink-0">
      <div className="flex items-end gap-3 bg-white rounded-brand shadow-soft px-4 py-3">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          disabled={streaming}
          placeholder={t.inputPlaceholder}
          className={`flex-1 resize-none outline-none text-sm text-ink bg-transparent placeholder:text-muted leading-relaxed max-h-40 ${language === 'ta' ? 'font-tamil' : ''}`}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button
          onClick={send}
          disabled={!value.trim() || streaming}
          aria-label="Send"
          className="shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
