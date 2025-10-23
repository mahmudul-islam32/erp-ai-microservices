import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { FloatingChatBox } from './FloatingChatBox';

export const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected } = useChat();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label="Messages"
      >
        <MessageSquare className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </button>

      {/* Floating Chat Box */}
      {isOpen && <FloatingChatBox onClose={() => setIsOpen(false)} />}
    </>
  );
};

