const suggestions = {
  en: ['Tell me a Tamil proverb', 'Explain Pongal festival', 'Help me learn Tamil', 'What is Carnatic music?'],
  ta: ['ஒரு தமிழ் பழமொழி சொல்லுங்கள்', 'பொங்கல் பண்டிகை பற்றி விளக்கவும்', 'கர்நாடக இசை என்றால் என்ன?', 'தமிழ் இலக்கியம் பற்றி கூறுங்கள்'],
};

interface Props { onSelect: (text: string) => void; language: 'en' | 'ta'; }

export default function SuggestionChips({ onSelect, language }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center px-4">
      {suggestions[language].map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`px-4 py-2 rounded-full border border-accent-soft text-sm text-muted hover:bg-accent-soft hover:text-ink transition-colors ${language === 'ta' ? 'font-tamil' : ''}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
