import { create } from 'zustand';

export const useKomiStore = create((set) => ({
  isVisible: true,
  setIsVisible: (visible) => set({ isVisible: visible }),
}));
