import { create } from 'zustand';

export interface Template {
  id: string;
  userId: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
  aiGenerated: boolean;
}

interface TemplateState {
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) => set((state) => ({ templates: [template, ...state.templates] })),
  updateTemplate: (template) => set((state) => ({
    templates: state.templates.map((t) => (t.id === template.id ? template : t))
  })),
  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter((t) => t.id !== id)
  })),
}));
