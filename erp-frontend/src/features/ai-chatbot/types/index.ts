export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at?: string;
  context?: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  metadata?: {
    intent?: string;
    query_type?: string;
    entities?: Record<string, any>;
    processing_time_ms?: number;
    tokens_used?: number;
    model?: string;
    provider?: string;
    error?: string;
  };
}

export interface LLMProvider {
  name: string;
  display_name: string;
  models: string[];
  note?: string;
}

export interface ProvidersResponse {
  providers: LLMProvider[];
  default_provider: string;
}

export interface ConversationCreate {
  title?: string;
  context?: Record<string, any>;
}

export interface MessageCreate {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

