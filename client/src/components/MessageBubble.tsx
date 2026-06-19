import type { Message } from '../stores/chatStore.js';

interface Props { message: Message; lang?: 'en' | 'ta'; }

export default function MessageBubble({ message, lang = 'en' }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`
        max-w-[80%] px-4 py-3 rounded-brand text-sm leading-relaxed whitespace-pre-wrap
        ${isUser ? 'bg-accent text-white rounded-br-sm' : 'bg-white shadow-soft text-ink rounded-bl-sm'}
        ${lang === 'ta' ? 'font-tamil' : ''}
      `}>
        {message.content}
      </div>
    </div>
  );
}
