import { useUIStore } from '../stores/uiStore.js';

export default function LanguageToggle() {
  const { language, setLanguage } = useUIStore();
  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
      className="text-xs font-medium px-3 py-1.5 rounded-full border border-accent-soft text-muted hover:bg-accent-soft transition-colors"
      aria-label="Toggle language"
    >
      {language === 'en' ? 'தமிழ்' : 'EN'}
    </button>
  );
}
