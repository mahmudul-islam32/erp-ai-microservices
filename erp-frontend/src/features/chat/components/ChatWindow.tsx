import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { sendMessage, fetchUnreadCount, fetchMessages } from '../store/chatSlice';
import type { Conversation } from '../types';
import { MessageList } from './MessageList';
import type { Message } from '../types';
import { chatApi } from '../services/chatApi';

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  isLoading?: boolean;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserId,
  isLoading = false,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [messageText, setMessageText] = useState('');
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  // Get messages DIRECTLY from Redux - check both length AND the actual array
  const allMessagesFromRedux = useAppSelector((state) => state.chat.messages);
  const messageCount = allMessagesFromRedux.length;
  const lastMessageId = allMessagesFromRedux[allMessagesFromRedux.length - 1]?._id || '';
  
  // Update local messages whenever Redux changes (watch count AND last message ID)
  useEffect(() => {
    if (!conversation?._id) {
      setLocalMessages([]);
      return;
    }
    
    const filtered = allMessagesFromRedux.filter((msg) => msg.conversation_id === conversation._id);
    setLocalMessages(filtered);
  }, [messageCount, lastMessageId, conversation?._id, allMessagesFromRedux]);
  
  // Use localMessages directly (not memoized)
  const conversationMessages = localMessages;
  
  // Combine with pending messages - Use useMemo to stabilize reference
  const displayMessages = useMemo(() => {
    return [...conversationMessages, ...pendingMessages];
  }, [conversationMessages.length, pendingMessages.length, 
      conversationMessages[conversationMessages.length - 1]?._id,
      pendingMessages[pendingMessages.length - 1]?._id]);
  
  // Mark messages as read when conversation becomes active
  useEffect(() => {
    if (conversation?._id) {
      chatApi.markMessagesAsRead(conversation._id)
        .then(() => {
          // Refresh unread count after marking as read
          dispatch(fetchUnreadCount());
        })
        .catch((error) => {
          console.error('Failed to mark messages as read:', error);
        });
    }
  }, [conversation?._id, dispatch]);

  // 🔥 POLLING: Check for new messages every 3 seconds when chatbox is open
  useEffect(() => {
    if (!conversation?._id) {
      return;
    }

    console.log('🔄 Starting smart polling for conversation:', conversation._id);
    
    let lastMessageCount = conversationMessages.length;
    let lastMessageId = conversationMessages[conversationMessages.length - 1]?._id;

    // Initial fetch only if no messages
    if (conversationMessages.length === 0) {
      dispatch(fetchMessages(conversation._id));
    }

    // Set up polling interval
    const intervalId = setInterval(async () => {
      // Fetch messages to check for new ones
      const result = await dispatch(fetchMessages(conversation._id));
      
      // Check if we got new messages
      if (result.payload && Array.isArray(result.payload)) {
        const newMessages = result.payload;
        const newCount = newMessages.length;
        const newLastId = newMessages[newMessages.length - 1]?._id;
        
        // Only log if there are actual new messages
        if (newCount > lastMessageCount || newLastId !== lastMessageId) {
          console.log('✨ New messages detected! Count:', lastMessageCount, '→', newCount);
          lastMessageCount = newCount;
          lastMessageId = newLastId;
        }
      }
    }, 3000); // Check every 3 seconds

    // Cleanup on unmount or conversation change
    return () => {
      console.log('🛑 Stopping message polling');
      clearInterval(intervalId);
    };
  }, [conversation?._id, dispatch]);

  // Clean up pending messages when they appear in Redux
  useEffect(() => {
    if (pendingMessages.length > 0 && conversationMessages.length > 0) {
      const cleaned = pendingMessages.filter(pending =>
        !conversationMessages.some(msg => msg.content === pending.content)
      );
      if (cleaned.length !== pendingMessages.length) {
        console.log('🧹 Cleaning pending messages');
        setPendingMessages(cleaned);
      }
    }
  }, [conversationMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !conversation) return;
    
    const messageContent = messageText.trim();
    
    console.log('💬 STEP 1 - Creating temp message for:', messageContent);
    console.log('💬 STEP 1 - Current displayMessages.length:', displayMessages.length);
    
    // Create temp message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversation_id: conversation._id,
      sender_id: currentUserId,
      sender_name: 'You',
      sender_email: '',
      content: messageContent,
      message_type: 'text',
      is_read: true,
      is_edited: false,
      is_deleted: false,
      read_by: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('💬 STEP 2 - Temp message created:', tempMessage._id);
    
    // Add to pending messages IMMEDIATELY
    setPendingMessages(prev => {
      const updated = [...prev, tempMessage];
      console.log('✅ STEP 3 - pendingMessages setState! From', prev.length, 'to', updated.length);
      return updated;
    });
    
    console.log('💬 STEP 4 - setState was called!');
    
    // Clear input
    setMessageText('');
    
    // Send to server in background
    dispatch(
      sendMessage({
        conversation_id: conversation._id,
        content: messageContent,
        message_type: 'text',
      })
    );
    
    console.log('💬 STEP 5 - Dispatched to Redux');
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <p className="text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const getConversationTitle = () => {
    if (conversation.name) {
      return conversation.name;
    }
    
    const otherParticipant = conversation.participant_details.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.name || 'Unknown User';
  };

  console.log('🎨 Rendering ChatWindow - displayMessages:', displayMessages.length);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-white">
        <div>
          <h2 className="font-semibold text-slate-900">{getConversationTitle()}</h2>
          <p className="text-xs text-slate-500">
            {conversation.is_group
              ? `${conversation.participant_ids.length} participants`
              : conversation.participant_details.find((p) => p.user_id !== currentUserId)?.email}
          </p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageList 
        messages={displayMessages} 
        currentUserId={currentUserId} 
        isLoading={isLoading} 
      />

      {/* Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
