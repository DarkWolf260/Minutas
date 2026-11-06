import type { Report, Template, WhatsAppRecipientGroup } from '@/lib/types';

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string | null;
  timestamp?: number;
  unreadCount?: number;
}

export interface WhatsAppLocation {
  latitude: number;
  longitude: number;
  description?: string | null;
  name?: string | null;
  url?: string | null;
  isLive?: boolean;
}

export interface QuotedWhatsAppMessage {
  id?: string | null;
  body?: string;
  type?: string;
  fromMe?: boolean;
  from?: string | null;
  author?: string | null;
  senderName?: string | null;
  authorAvatar?: string | null;
  hasMedia?: boolean;
  mediaUrl?: string | null;
  thumbnail?: string | null;
  isRevoked?: boolean;
  location?: WhatsAppLocation | null;
  albumCount?: number;
}

export interface WhatsAppMessage {
  id: string;
  body: string;
  type: string;
  timestamp: number;
  fromMe: boolean;
  from: string;
  to: string;
  author: string | null;
  senderName: string | null;
  authorAvatar?: string | null;
  hasMedia: boolean;
  mediaUrl?: string | null;
  thumbnail?: string | null;
  ack?: number;
  isRevoked?: boolean;
  hasQuotedMsg?: boolean;
  quotedMsg?: QuotedWhatsAppMessage | null;
  location?: WhatsAppLocation | null;
  albumMessages?: WhatsAppMessage[];
}

export interface WhatsAppStatus {
  isReady: boolean;
  needsAuth: boolean;
  qr: string | null;
  statusMessage?: string;
  activeWorkspace?: string | null;
  isWorkspaceMatch?: boolean;
}

export interface BotState {
  status: WhatsAppStatus;
  chats: WhatsAppChat[];
  isAvailable: boolean;
  isLoading: boolean;
  isCloudActive: boolean;
  conflictBotUrl: string | null;
  activeWorkspace: string | null;
  isWorkspaceMatch: boolean;
}

export interface ChatItem {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string | null;
}

export interface UseWhatsAppChatOptions {
  reports: Report[];
  templates: Template[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
  guardiaAbierta: boolean;
  initialChatId?: string | null;
  externalActiveChatId?: string | null;
  onChatChange?: (id: string) => void;
}

export interface ScheduledMessage {
  id: string;
  chatId: string;
  message: string;
  title: string;
  scheduledTime: string; // ISO string
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  media?: { url: string; name?: string; description?: string }[];
}

export type { WhatsAppRecipientGroup };
