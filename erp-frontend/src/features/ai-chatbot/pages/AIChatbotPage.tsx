import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { AIChatWindow } from '../components/AIChatWindow';
import { chatbotApi } from '../services/chatbotApi';
import type { Conversation } from '../types';
import { toast } from 'sonner';

export const AIChatbotPage: React.FC = () => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

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
      // Don't show error toast on initial load
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleConversationChange = (newConversation: Conversation | null) => {
    setConversation(newConversation);
    
    // Reload conversations list to reflect changes
    if (newConversation) {
      loadConversations();
    }
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
        {/* Optional: Conversation sidebar could go here */}
        <div className="flex-1">
          <AIChatWindow
            conversation={conversation}
            onConversationChange={handleConversationChange}
          />
        </div>
      </div>
    </div>
  );
};

