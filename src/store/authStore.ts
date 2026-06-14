import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('gmail_accessToken'),
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem('gmail_accessToken', accessToken);
    } else {
      localStorage.removeItem('gmail_accessToken');
    }
    set({ accessToken });
  },
  logout: () => {
    localStorage.removeItem('gmail_accessToken');
    set({ user: null, accessToken: null });
  },
}));

