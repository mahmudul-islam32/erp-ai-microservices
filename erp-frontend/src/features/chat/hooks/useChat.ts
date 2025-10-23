import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  addMessage,
  setConnectionStatus,
  fetchConversations,
  fetchMessages,
  fetchUnreadCount,
  setActiveConversation,
} from '../store/chatSlice';
import { chatApi } from '../services/chatApi';
import type { Message } from '../types';
import { playMessageSound } from '../utils/notificationSound';

export const useChat = () => {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector((state) => state.chat.conversations);
  const activeConversation = useAppSelector((state) => state.chat.activeConversation);
  const messages = useAppSelector((state) => state.chat.messages);
  const isConnected = useAppSelector((state) => state.chat.isConnected);
  const isLoading = useAppSelector((state) => state.chat.isLoading);
  const unreadCount = useAppSelector((state) => state.chat.unreadCount);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token available, skipping WebSocket connection');
        return;
      }

      const wsUrl = chatApi.getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Chat WebSocket connected');
        dispatch(setConnectionStatus(true));
        dispatch(fetchConversations());
        dispatch(fetchUnreadCount());
      };

      ws.onmessage = async (event) => {
        try {
          if (event.data === 'pong') return;

          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              if (data.action === 'created' && data.data) {
                const message = data.data as Message;
                console.log('📨 ============ WEBSOCKET MESSAGE RECEIVED ============');
                console.log('📨 Message ID:', message._id);
                console.log('📨 Message content:', message.content);
                console.log('📨 Conversation ID:', message.conversation_id);
                console.log('📨 Sender:', message.sender_name);
                console.log('📨 Active conversation ID:', activeConversation?._id);
                console.log('📨 Is for active conversation?', activeConversation && message.conversation_id === activeConversation._id);
                
                console.log('📨 Dispatching addMessage to Redux...');
                dispatch(addMessage(message));
                console.log('📨 addMessage dispatched!');
                
                const currentUserId = currentUser?.id || currentUser?._id;
                
                // If this message is for the currently active conversation and from someone else
                if (activeConversation && message.conversation_id === activeConversation._id) {
                  console.log('✅ Message is for active conversation, marking as read');
                  // Mark as read immediately since the user is viewing this conversation
                  try {
                    await chatApi.markMessagesAsRead(message.conversation_id);
                    console.log('✅ Marked messages as read for active conversation');
                  } catch (error) {
                    console.error('Failed to mark messages as read:', error);
                  }
                } else if (message.sender_id !== currentUserId) {
                  console.log('🔔 Playing notification sound (not active conversation)');
                  // Only play sound for messages from others in different conversations
                  playMessageSound();
                }
                
                // Refresh unread count
                console.log('📊 Fetching unread count...');
                dispatch(fetchUnreadCount());
                console.log('📨 ============ WEBSOCKET HANDLING COMPLETE ============');
              }
              break;
            
            case 'connection':
              console.log('Chat connection confirmed:', data.message);
              break;
            
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          if (!(error instanceof SyntaxError)) {
            console.error('Error handling WebSocket message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        dispatch(setConnectionStatus(false));
      };

      ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
        dispatch(setConnectionStatus(false));
        wsRef.current = null;

        // Attempt to reconnect
        const token = localStorage.getItem('access_token');
        if (token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting Chat WebSocket:', error);
      dispatch(setConnectionStatus(false));
    }
  }, [dispatch, currentUser]);

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

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, connectWebSocket, disconnectWebSocket]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      dispatch(fetchMessages(activeConversation._id));
    }
  }, [activeConversation, dispatch]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const conversation = await chatApi.getConversation(conversationId);
      dispatch(setActiveConversation(conversation));
      // Also refresh the conversations list
      dispatch(fetchConversations());
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [dispatch]);

  return {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isLoading,
    unreadCount,
    setActiveConversation: (conversation: any) => dispatch(setActiveConversation(conversation)),
    refreshConversations: () => dispatch(fetchConversations()),
    loadConversation,
  };
};

