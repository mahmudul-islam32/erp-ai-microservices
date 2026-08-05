import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Trash2, ChevronLeft } from 'lucide-react';
import { chatbotApi } from '../services/chatbotApi';
import type { Message, Conversation } from '../types';
import { ModelSelector } from './ModelSelector';
import { toast } from 'sonner';

interface AIChatWindowProps {
  conversation: Conversation | null;
  onConversationChange: (conversation: Conversation | null) => void;
  onCloseMobile?: () => void;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  conversation,
  onConversationChange,
  onCloseMobile,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load saved provider/model preferences from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai-chatbot-provider');
    const savedModel = localStorage.getItem('ai-chatbot-model');
    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedModel) setSelectedModel(savedModel);
    else {
      // Set default model to gpt-4o-mini if not saved
      setSelectedModel('gpt-4o-mini');
      localStorage.setItem('ai-chatbot-model', 'gpt-4o-mini');
    }
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      setIsLoadingMessages(true);
      const loadedMessages = await chatbotApi.getMessages(conversation.id);
      setMessages(loadedMessages);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    try {
      let currentConversation = conversation;

      // Create conversation if it doesn't exist
      if (!currentConversation) {
        currentConversation = await chatbotApi.createConversation();
        onConversationChange(currentConversation);
      }

      // Add user message immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversation.id,
        content: text,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send message and get AI response with selected provider/model
      const aiMessage = await chatbotApi.sendMessage(
        currentConversation.id,
        text,
        selectedProvider,
        selectedModel
      );
      
      // Keep user message and append AI response (API returns only the AI message)
      setMessages((prev) => [...prev, aiMessage]);

      // Reload conversation to get updated metadata
      const updatedConv = await chatbotApi.getConversation(currentConversation.id);
      onConversationChange(updatedConv);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.response?.data?.detail || 'Failed to send message');
      
      // Remove temporary message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    onConversationChange(null);
    setMessages([]);
    setInputText('');
  };

  const handleDeleteConversation = async () => {
    if (!conversation) return;

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await chatbotApi.deleteConversation(conversation.id);
      onConversationChange(null);
      setMessages([]);
      toast.success('Conversation deleted');
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleProviderChange = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    // Save to localStorage
    localStorage.setItem('ai-chatbot-provider', provider);
    localStorage.setItem('ai-chatbot-model', model);
    toast.success(`Switched to ${provider} - ${model}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
          )}
          <Bot className="h-6 w-6 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">
              {conversation?.title || 'AI Assistant'}
            </h2>
            {conversation && (
              <p className="text-xs text-slate-500">
                {conversation.message_count} messages
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ModelSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={handleProviderChange}
          />
          {conversation && (
            <button
              onClick={handleDeleteConversation}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Delete conversation"
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-2.5">
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1.5">
              Start a conversation
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Ask about sales, inventory, finance, and more.
            </p>
            <div className="mt-4 text-xs text-slate-400 space-y-0.5">
              <p>Try: &quot;What were my sales last month?&quot;</p>
              <p>&quot;Show me low stock items&quot;</p>
              <p>&quot;Generate a revenue report&quot;</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary-600" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-3 py-1.5 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200/60'
                }`}
              >
                <div className="text-sm leading-snug whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {message.metadata && (message.metadata.provider || message.metadata.model || message.metadata.processing_time_ms) && (
                  <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200/50 flex items-center gap-1.5 flex-wrap">
                    {message.metadata.provider && (
                      <span className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-600">
                        {message.metadata.provider}
                      </span>
                    )}
                    {message.metadata.model && message.metadata.model !== 'fallback' && (
                      <span className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-600">
                        {message.metadata.model}
                      </span>
                    )}
                    {message.metadata.processing_time_ms != null && (
                      <span>{Math.round(message.metadata.processing_time_ms)}ms</span>
                    )}
                    {message.metadata.tokens_used != null && (
                      <span>{message.metadata.tokens_used} tokens</span>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-6 w-6 rounded-full bg-slate-300 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary-600" />
              </div>
            </div>
            <div className="bg-slate-100 rounded-xl rounded-bl-md px-3 py-1.5 shadow-sm border border-slate-200/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 px-4 sm:px-6 py-3 bg-slate-50/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your ERP..."
            className="flex-1 min-h-[44px] max-h-[160px] py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none placeholder:text-slate-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="h-[44px] px-4 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

