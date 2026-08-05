import React, { useState, useEffect } from 'react';
import { Bot, Plus } from 'lucide-react';
import { AIChatWindow } from '../components/AIChatWindow';
import { AIConversationList } from '../components/AIConversationList';
import { chatbotApi } from '../services/chatbotApi';
import type { Conversation } from '../types';
import { Button } from '@/shared/components/ui/Button';

export const AIChatbotPage: React.FC = () => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const loaded = await chatbotApi.getConversations();
      setConversations(loaded);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleConversationChange = (newConversation: Conversation | null) => {
    setConversation(newConversation);
    if (newConversation) {
      loadConversations();
      setShowMobileChat(true);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversation(conv);
    setShowMobileChat(true);
  };

  const handleNewChat = () => {
    setConversation(null);
    setShowMobileChat(true);
  };

  const handleCloseMobileChat = () => {
    setShowMobileChat(false);
    setConversation(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-sm text-slate-500">
                Powered by advanced NLP and deep learning
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation sidebar - hidden on mobile when chat is open */}
        <div
          className={`${
            showMobileChat ? 'hidden' : 'flex'
          } lg:flex flex-col w-full lg:w-80 border-r border-slate-200`}
        >
          <div className="py-2.5 px-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleNewChat} className="flex items-center gap-1.5 text-xs" variant="secondary" size="small">
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          <AIConversationList
            conversations={conversations}
            activeConversationId={conversation?.id}
            onSelect={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Chat window - full width on mobile when open */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-w-0`}>
          <AIChatWindow
            conversation={conversation}
            onConversationChange={handleConversationChange}
            onCloseMobile={showMobileChat ? handleCloseMobileChat : undefined}
          />
        </div>
      </div>
    </div>
  );
};

