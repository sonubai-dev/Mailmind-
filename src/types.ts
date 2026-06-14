export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  tags: string[];
  createdAt: string;
  status?: 'active' | 'unsubscribed' | 'bounced';
  sentCount?: number;
  openCount?: number;
  clickCount?: number;
}

export interface Recipient {
  name: string;
  email: string;
  company?: string;
}

export interface Automation {
  id: string;
  userId: string;
  name: string;
  type: 'welcome' | 'order' | 'booking' | 'custom';
  trigger: string;
  templateId?: string;
  status: 'active' | 'paused';
  updatedAt: string;
}

export interface IntegrationSource {
  id: string;
  userId: string;
  name: string;
  apiKey: string;
  platform: string;
  status: string;
  updatedAt: string;
}
