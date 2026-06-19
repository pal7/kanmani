import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'ta';

interface UIStore {
  language: Language;
  sidebarOpen: boolean;
  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      language: 'en',
      sidebarOpen: false,
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'kanmani-ui' },
  ),
);
