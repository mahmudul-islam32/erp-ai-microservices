import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  addNotification,
  setConnectionStatus,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from './notificationsSlice';
import { notificationService } from './notificationService';
import type { Notification as NotificationData } from './types';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);
  const isLoading = useAppSelector((state) => state.notifications.isLoading);
  const isConnected = useAppSelector((state) => state.notifications.isConnected);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    try {
      // Check if token exists
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token available, skipping WebSocket connection');
        return;
      }

      const wsUrl = notificationService.getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        dispatch(setConnectionStatus(true));
        reconnectAttempts.current = 0;
        
        // Fetch initial notifications
        dispatch(fetchNotifications({}));
        dispatch(fetchUnreadCount());
      };

      ws.onmessage = (event) => {
        try {
          // Handle plain text messages (like "pong")
          if (typeof event.data === 'string' && event.data === 'pong') {
            // Heartbeat response, ignore
            return;
          }

          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'notification':
              if (data.action === 'created' && data.data) {
                dispatch(addNotification(data.data as NotificationData));
                // Show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(data.data.title, {
                    body: data.data.message,
                    icon: '/logo.png',
                  });
                }
              } else if (data.action === 'read') {
                // Notification marked as read
                dispatch(fetchUnreadCount());
              } else if (data.action === 'mark_all_read') {
                // All notifications marked as read
                dispatch(fetchUnreadCount());
              } else if (data.action === 'deleted') {
                // Notification deleted
                dispatch(fetchUnreadCount());
              }
              break;
            
            case 'connection':
              console.log('Connection confirmed:', data.message);
              break;
            
            case 'heartbeat':
              // Heartbeat received
              ws.send('ping');
              break;
            
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          // Ignore JSON parse errors for non-JSON messages
          if (!(error instanceof SyntaxError)) {
            console.error('Error handling WebSocket message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(setConnectionStatus(false));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        dispatch(setConnectionStatus(false));
        wsRef.current = null;

        // Only attempt to reconnect if token still exists (user still logged in)
        const token = localStorage.getItem('access_token');
        if (token && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      dispatch(setConnectionStatus(false));
    }
  }, [dispatch]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    dispatch(setConnectionStatus(false));
  }, [dispatch]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Connect when authenticated, disconnect on unmount or logout
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
      requestNotificationPermission();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, connectWebSocket, disconnectWebSocket, requestNotificationPermission]);

  // Actions
  const handleMarkAsRead = useCallback((notificationId: string) => {
    dispatch(markAsRead(notificationId));
  }, [dispatch]);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const handleDeleteNotification = useCallback((notificationId: string) => {
    dispatch(deleteNotification(notificationId));
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchNotifications({}));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearNotifications());
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    refresh: handleRefresh,
    clearAll: handleClearAll,
  };
};

