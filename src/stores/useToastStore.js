import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));

export default useToastStore;
