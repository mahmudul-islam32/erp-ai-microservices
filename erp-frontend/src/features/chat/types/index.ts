export interface Message {
  _id: string;
  id?: string;  // Optional for compatibility
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  read_by: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  _id: string;
  participant_ids: string[];
  participant_details: ParticipantDetail[];
  name?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    sender_id: string;
    sender_name: string;
    created_at: string;
  };
  last_message_at?: string;
  unread_count: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface ParticipantDetail {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface SendMessagePayload {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface CreateConversationPayload {
  participant_ids: string[];
  name?: string;
  is_group?: boolean;
}

