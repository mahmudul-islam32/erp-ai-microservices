import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '../types';

interface AIConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
}

export const AIConversationList: React.FC<AIConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  isLoading = false,
}) => {
  return (
    <div className="h-full overflow-y-auto">
      {isLoading ? (
        <div className="p-3 text-center text-slate-500">
          <p className="text-xs">Loading...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-3 text-center text-slate-500">
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start a new chat to begin</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv)}
                className={`w-full py-2.5 px-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-2 ${
                  isActive ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate leading-tight ${isActive ? 'text-primary-700' : 'text-slate-700'}`}>
                    {conv.title || 'New Conversation'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
                    {conv.last_message_at && (
                      <> · {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}</>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
