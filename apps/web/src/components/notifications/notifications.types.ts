export interface NotificationLogItem {
  id: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  message: string;
  status: 'QUEUED' | 'SUBMITTED' | 'DELIVERED' | 'FAILED';
  attempts: number;
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface NotificationTemplateItem {
  id: string;
  type: string;
  name: string;
  templateText: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface SendDirectSmsFormData {
  recipientPhone: string;
  message: string;
}
