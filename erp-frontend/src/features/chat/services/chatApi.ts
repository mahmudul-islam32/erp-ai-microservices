import axios from 'axios';
import type { Message, Conversation, SendMessagePayload, CreateConversationPayload } from '../types';

const CHAT_API_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:8005';

// Create axios instance
const chatClient = axios.create({
  baseURL: CHAT_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
chatClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const chatApi = {
  // Conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await chatClient.get('/api/v1/chat/conversations');
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await chatClient.get(`/api/v1/chat/conversations/${conversationId}`);
    return response.data;
  },

  createConversation: async (data: CreateConversationPayload): Promise<Conversation> => {
    const response = await chatClient.post('/api/v1/chat/conversations', data);
    return response.data;
  },

  // Messages
  getMessages: async (conversationId: string, skip = 0, limit = 100): Promise<Message[]> => {
    const response = await chatClient.get(`/api/v1/chat/conversations/${conversationId}/messages`, {
      params: { skip, limit },
    });
    return response.data;
  },

  sendMessage: async (data: SendMessagePayload): Promise<Message> => {
    const response = await chatClient.post('/api/v1/chat/messages', data);
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await chatClient.delete(`/api/v1/chat/messages/${messageId}`);
  },

  // Unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await chatClient.get('/api/v1/chat/unread-count');
    return response.data.unread_count;
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string): Promise<void> => {
    await chatClient.post(`/api/v1/chat/conversations/${conversationId}/mark-read`);
  },

  // WebSocket URL
  getWebSocketUrl: (): string => {
    const token = localStorage.getItem('access_token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = CHAT_API_URL.replace('http://', '').replace('https://', '');
    return `${wsProtocol}//${wsHost}/api/v1/chat/ws?token=${token}`;
  },
};

