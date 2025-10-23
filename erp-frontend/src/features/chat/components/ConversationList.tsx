import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  currentUserId: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  currentUserId,
}) => {
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) {
      return conversation.name;
    }
    
    // For direct conversations, show the other person's name
    const otherParticipant = conversation.participant_details.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.name || 'Unknown User';
  };

  const getUnreadCount = (conversation: Conversation): number => {
    return conversation.unread_count?.[currentUserId] || 0;
  };

  return (
    <div className="h-full overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-slate-500">
          <p>No conversations yet</p>
          <p className="text-sm mt-2">Start a new conversation to begin chatting</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {conversations.map((conversation) => {
            const isActive = conversation._id === activeConversationId;
            const unreadCount = getUnreadCount(conversation);
            
            return (
              <button
                key={conversation._id}
                onClick={() => onSelect(conversation)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                  isActive ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {getConversationName(conversation)}
                      </h3>
                      {conversation.is_group && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                          Group
                        </span>
                      )}
                    </div>
                    
                    {conversation.last_message && (
                      <p className={`text-sm mt-1 truncate ${unreadCount > 0 ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                        {conversation.last_message.sender_id === currentUserId ? 'You: ' : ''}
                        {conversation.last_message.content}
                      </p>
                    )}
                    
                    {conversation.last_message_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  
                  {unreadCount > 0 && (
                    <span className="flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center bg-primary-600 text-white text-xs font-bold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

