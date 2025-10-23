import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Maximize2, Minimize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { sendMessage, fetchMessages } from '../store/chatSlice';
import type { Conversation } from '../types';

interface ChatDropdownProps {
  onClose: () => void;
}

export const ChatDropdown: React.FC<ChatDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { conversations, activeConversation, messages, setActiveConversation } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const currentUserId = user?.id || user?._id || '';

  // Filter messages for the active conversation
  const conversationMessages = activeConversation
    ? messages.filter((msg) => msg.conversation_id === activeConversation._id)
    : [];

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setIsExpanded(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeConversation) return;
    
    try {
      await dispatch(
        sendMessage({
          conversation_id: activeConversation._id,
          content: messageInput.trim(),
          message_type: 'text',
        })
      ).unwrap();
      
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) return conversation.name;
    const other = conversation.participant_details.find((p) => p.user_id !== currentUserId);
    return other?.name || 'Unknown User';
  };

  const getUnreadCount = (conversation: Conversation): number => {
    return conversation.unread_count?.[currentUserId] || 0;
  };

  useEffect(() => {
    if (activeConversation) {
      dispatch(fetchMessages(activeConversation._id));
    }
  }, [activeConversation, dispatch]);

  return (
    <div
      className={`absolute right-0 mt-2 ${
        isExpanded ? 'w-96 h-[500px]' : 'w-80 max-h-96'
      } bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col z-50`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">
            {activeConversation ? getConversationName(activeConversation) : 'Messages'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!activeConversation ? (
          /* Conversation List */
          <div className="h-full overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm mt-1">Start a conversation to begin chatting</p>
                <button
                  onClick={() => {
                    navigate('/dashboard/messages');
                    onClose();
                  }}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Go to Messages →
                </button>
              </div>
            ) : (
              <div>
                {conversations.slice(0, 5).map((conversation) => {
                  const unreadCount = getUnreadCount(conversation);
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation)}
                      className="w-full p-3 hover:bg-slate-50 border-b border-slate-100 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                            {getConversationName(conversation)}
                          </h4>
                          {conversation.last_message && (
                            <p className={`text-xs mt-1 truncate ${unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-500 text-white text-xs font-bold rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.last_message_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </p>
                      )}
                    </button>
                  );
                })}
                
                {conversations.length > 5 && (
                  <button
                    onClick={() => {
                      navigate('/dashboard/messages');
                      onClose();
                    }}
                    className="w-full p-3 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-medium transition-colors"
                  >
                    View all conversations →
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Chat Window */
          <div className="h-full flex flex-col">
            {/* Back Button */}
            <button
              onClick={() => setActiveConversation(null)}
              className="p-2 text-sm text-primary-600 hover:bg-primary-50 border-b border-slate-200 text-left"
            >
              ← Back to conversations
            </button>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {conversationMessages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <p className="text-xs text-slate-600 mb-1 px-2">{message.sender_name}</p>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-slate-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Input */}
            <div className="border-t border-slate-200 p-3">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer - View All Link */}
      {!activeConversation && conversations.length > 0 && (
        <div className="border-t border-slate-200 p-3 bg-slate-50">
          <button
            onClick={() => {
              navigate('/dashboard/messages');
              onClose();
            }}
            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all messages
          </button>
        </div>
      )}
    </div>
  );
};

