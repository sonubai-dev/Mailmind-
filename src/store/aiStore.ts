import { create } from 'zustand';

interface AIState {
  isAutoReplyEnabled: boolean;
  persona: string;
  keywords: string[];
  blocklist: string[];
  delay: number;
  maxPerHour: number;
  logs: any[];
  setAutoReplyEnabled: (enabled: boolean) => void;
  setPersona: (persona: string) => void;
  setKeywords: (keywords: string[]) => void;
  setBlocklist: (blocklist: string[]) => void;
  setDelay: (delay: number) => void;
  setMaxPerHour: (max: number) => void;
  setLogs: (logs: any[]) => void;
  addLog: (log: any) => void;
}

export const useAIStore = create<AIState>((set) => ({
  isAutoReplyEnabled: false,
  persona: "You are a helpful assistant. Reply professionally and concisely.",
  keywords: [],
  blocklist: [],
  delay: 0,
  maxPerHour: 10,
  logs: [],
  setAutoReplyEnabled: (isAutoReplyEnabled) => set({ isAutoReplyEnabled }),
  setPersona: (persona) => set({ persona }),
  setKeywords: (keywords) => set({ keywords }),
  setBlocklist: (blocklist) => set({ blocklist }),
  setDelay: (delay) => set({ delay }),
  setMaxPerHour: (maxPerHour) => set({ maxPerHour }),
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
}));
