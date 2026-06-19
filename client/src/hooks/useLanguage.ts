import { useUIStore } from '../stores/uiStore.js';

export function useLanguage() {
  return useUIStore((s) => ({ language: s.language, setLanguage: s.setLanguage }));
}
