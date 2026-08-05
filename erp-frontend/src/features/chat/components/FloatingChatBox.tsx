import React, { useState, useEffect, useMemo } from 'react';
import { X, Minimize2, MessageSquare } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { useChat } from '../hooks/useChat';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';

interface FloatingChatBoxProps {
  onClose: () => void;
}

export const FloatingChatBox: React.FC<FloatingChatBoxProps> = ({ onClose }) => {
  const { user } = useAppSelector((state) => state.auth);
  const {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isLoading,
    setActiveConversation,
    loadConversation,
  } = useChat();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');

  const currentUserId = user?.id || user?._id || '';

  // Filter messages for the active conversation
  const conversationMessages = useMemo(() => {
    if (!activeConversation) return [];
    const filtered = messages.filter((msg) => msg.conversation_id === activeConversation._id);
    console.log('🔍 FloatingChatBox - Filtering messages:', {
      total: messages.length,
      filtered: filtered.length,
      conversationId: activeConversation._id,
      lastMessage: filtered.slice(-1).map(m => ({ id: m._id, content: m.content }))
    });
    return filtered;
  }, [messages, activeConversation]);

  // Log when conversationMessages changes
  useEffect(() => {
    console.log('🎯 conversationMessages changed to:', conversationMessages.length);
  }, [conversationMessages]);

  // Debug: Log when messages change
  useEffect(() => {
    console.log('📊 FloatingChatBox - Messages array changed:', messages.length);
  }, [messages]);

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    setView('chat');
  };

  const handleBack = () => {
    setActiveConversation(null);
    setView('list');
  };

  const handleConversationCreated = (conversationId: string) => {
    loadConversation(conversationId);
    setView('chat');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 transition-colors"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-slate-200">
        {/* Header */}
        <div className="bg-primary-600 text-white rounded-t-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">
              {view === 'chat' && activeConversation
                ? activeConversation.name ||
                  activeConversation.participant_details.find((p) => p.user_id !== currentUserId)?.name ||
                  'Chat'
                : 'Messages'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="w-2 h-2 bg-success-400 rounded-full"></span>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="hover:bg-primary-700 rounded p-1 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="hover:bg-primary-700 rounded p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'list' ? (
            <div className="h-full flex flex-col">
              {/* New Chat Button */}
              <div className="p-3 border-b border-slate-200">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  + New Chat
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversation?._id}
                  onSelect={handleSelectConversation}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          ) : (
            <ChatWindow
              conversation={activeConversation}
              currentUserId={currentUserId}
              isLoading={isLoading}
              onClose={handleBack}
            />
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          currentUserId={currentUserId}
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </>
  );
};

