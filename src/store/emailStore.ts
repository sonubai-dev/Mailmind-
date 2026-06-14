import { create } from 'zustand';

interface EmailState {
  emails: any[];
  currentThread: any | null;
  unreadCount: number;
  isLoading: boolean;
  setEmails: (emails: any[]) => void;
  setCurrentThread: (thread: any | null) => void;
  setUnreadCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useEmailStore = create<EmailState>((set) => ({
  emails: [],
  currentThread: null,
  unreadCount: 0,
  isLoading: false,
  setEmails: (emails) => set({ emails }),
  setCurrentThread: (currentThread) => set({ currentThread }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
