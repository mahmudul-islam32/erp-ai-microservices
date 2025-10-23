import axios from 'axios';
import { Notification } from './types';

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8004';
const API_URL = `${NOTIFICATION_SERVICE_URL}/api/v1/notifications`;

const getAuthToken = () => {
  const token = localStorage.getItem('access_token');
  return token;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationService = {
  // Get all notifications
  async getNotifications({ unreadOnly = false, skip = 0, limit = 50 } = {}): Promise<Notification[]> {
    try {
      const response = await axios.get(API_URL, {
        params: { unread_only: unreadOnly, skip, limit },
        headers: getAuthHeaders(),
        timeout: 10000, // 10 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on error instead of throwing
    }
  },

  // Get unread notification count
  async getUnreadCount(): Promise<{ unread_count: number }> {
    try {
      const response = await axios.get(`${API_URL}/unread-count`, {
        headers: getAuthHeaders(),
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { unread_count: 0 };
    }
  },

  // Get single notification
  async getNotification(id: string): Promise<Notification> {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    await axios.patch(`${API_URL}/${id}/read`, {}, {
      headers: getAuthHeaders(),
    });
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await axios.post(`${API_URL}/mark-all-read`, {}, {
      headers: getAuthHeaders(),
    });
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // Get WebSocket URL
  getWebSocketUrl(): string {
    const token = getAuthToken();
    const wsProtocol = NOTIFICATION_SERVICE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = NOTIFICATION_SERVICE_URL.replace(/^https?/, wsProtocol);
    return `${wsUrl}/api/v1/ws?token=${token}`;
  },
};

