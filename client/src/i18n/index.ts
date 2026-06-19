import { useUIStore } from '../stores/uiStore.js';
import { en } from './en.js';
import { ta } from './ta.js';

const translations = { en, ta } as const;

export function useT() {
  const language = useUIStore((s) => s.language);
  return translations[language];
}
