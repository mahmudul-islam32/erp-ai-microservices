import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { useChat } from '../hooks/useChat';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { NewChatModal } from '../components/NewChatModal';
import { Button } from '../../../shared/components/ui/Button';

export const ChatPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const {
    conversations,
    activeConversation,
    isConnected,
    isLoading,
    setActiveConversation,
    loadConversation,
  } = useChat();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const currentUserId = user?.id || user?._id || '';

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    setShowMobileChat(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    // Load the new conversation
    loadConversation(conversationId);
    setShowMobileChat(true);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <p className="text-sm text-slate-500">
                {isConnected ? (
                  <span className="text-success-600">● Connected</span>
                ) : (
                  <span className="text-slate-400">○ Disconnected</span>
                )}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List - Desktop always shown, Mobile hidden when chat is open */}
        <div
          className={`${
            showMobileChat ? 'hidden' : 'flex'
          } lg:flex flex-col w-full lg:w-80 border-r border-slate-200`}
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Conversations</h2>
            <p className="text-xs text-slate-500 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?._id}
            onSelect={handleSelectConversation}
            currentUserId={currentUserId}
          />
        </div>

        {/* Chat Window - Desktop always shown, Mobile shown when conversation is selected */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex flex-col flex-1`}>
          <ChatWindow
            conversation={activeConversation}
            currentUserId={currentUserId}
            isLoading={isLoading}
            onClose={() => {
              setShowMobileChat(false);
              setActiveConversation(null);
            }}
          />
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
    </div>
  );
};

