import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

// Memoize to prevent re-renders when props haven't changed
export const MessageList: React.FC<MessageListProps> = React.memo(({
  messages,
  currentUserId,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll on NEW messages, not on every render
  const prevMessageCountRef = useRef(messages.length);
  
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    
    // Only scroll if we have NEW messages (count increased)
    if (currentCount > prevCount) {
      console.log('📋 New message added, scrolling. Count:', prevCount, '→', currentCount);
      scrollToBottom();
      prevMessageCountRef.current = currentCount;
    } else if (currentCount === 0 || prevCount === 0) {
      // Initial load or conversation change
      prevMessageCountRef.current = currentCount;
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <p>No messages yet</p>
          <p className="text-sm mt-2">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.sender_id === currentUserId;
        
        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {!isOwnMessage && (
                <p className="text-xs text-slate-600 mb-1 px-3">
                  {message.sender_name}
                </p>
              )}
              
              <div
                className={`rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-primary-100' : 'text-slate-500'
                  }`}
                >
                  {format(new Date(message.created_at), 'HH:mm')}
                  {message.is_edited && ' (edited)'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if messages actually changed
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false; // Re-render (messages changed)
  }
  if (prevProps.currentUserId !== nextProps.currentUserId) {
    return false; // Re-render (user changed)
  }
  if (prevProps.isLoading !== nextProps.isLoading) {
    return false; // Re-render (loading state changed)
  }
  // Check if last message changed (most common case)
  const prevLast = prevProps.messages[prevProps.messages.length - 1]?._id;
  const nextLast = nextProps.messages[nextProps.messages.length - 1]?._id;
  if (prevLast !== nextLast) {
    return false; // Re-render (last message changed)
  }
  return true; // Don't re-render (nothing changed)
});

