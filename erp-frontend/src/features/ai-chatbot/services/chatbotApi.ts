import axios from 'axios';
import type { Conversation, Message, ConversationCreate } from '../types';

const AI_CHATBOT_API_URL = import.meta.env.VITE_AI_CHATBOT_SERVICE_URL || 'http://localhost:8008';

// Create axios instance
const chatbotClient = axios.create({
  baseURL: AI_CHATBOT_API_URL,
  timeout: 180000, // 3 minutes timeout for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
chatbotClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const chatbotApi = {
  // Conversations
  getConversations: async (skip = 0, limit = 50): Promise<Conversation[]> => {
    const response = await chatbotClient.get('/api/v1/ai-chatbot/conversations', {
      params: { skip, limit },
    });
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await chatbotClient.get(`/api/v1/ai-chatbot/conversations/${conversationId}`);
    return response.data;
  },

  createConversation: async (data?: ConversationCreate): Promise<Conversation> => {
    const response = await chatbotClient.post('/api/v1/ai-chatbot/conversations', data || {});
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await chatbotClient.delete(`/api/v1/ai-chatbot/conversations/${conversationId}`);
  },

  // Messages
  getMessages: async (conversationId: string, skip = 0, limit = 50): Promise<Message[]> => {
    const response = await chatbotClient.get(
      `/api/v1/ai-chatbot/conversations/${conversationId}/messages`,
      {
        params: { skip, limit },
      }
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    provider?: string,
    model?: string
  ): Promise<Message> => {
    const params: any = {};
    if (provider) params.provider = provider;
    if (model) params.model = model;

    const response = await chatbotClient.post(
      `/api/v1/ai-chatbot/conversations/${conversationId}/messages`,
      {
        content,
        role: 'user',
      },
      { params }
    );
    return response.data;
  },

  // Quick chat (creates conversation if needed)
  quickChat: async (
    message: string,
    conversationId?: string,
    provider?: string,
    model?: string
  ): Promise<{ message: Message; conversationId: string }> => {
    const params: any = {
      message,
      ...(conversationId && { conversation_id: conversationId }),
    };
    if (provider) params.provider = provider;
    if (model) params.model = model;

    const response = await chatbotClient.post('/api/v1/ai-chatbot/chat', null, {
      params,
    });
    return {
      message: response.data,
      conversationId: response.data.conversation_id,
    };
  },

  // Get available providers and models
  getProviders: async (): Promise<{
    providers: Array<{
      name: string;
      display_name: string;
      models: string[];
      note?: string;
    }>;
    default_provider: string;
  }> => {
    const response = await chatbotClient.get('/api/v1/ai-chatbot/providers');
    return response.data;
  },
};

