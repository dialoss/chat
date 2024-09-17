import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Background {
  type: 'image' | 'color';
  color: string;
  image: string;
}

interface State {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (isOpen: boolean) => void;
  background: Background;
  setBackground: (background: Background) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      isOpen: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setIsOpen: (isOpen) => set({ isOpen }),
      background: {
        type: 'image',
        color: '#000000',
        image: '',
      },
      setBackground: (background) => set({ background }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ background: state.background }),
    }
  )
);