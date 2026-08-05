import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { ChatState, Conversation, Message, SendMessagePayload, CreateConversationPayload } from '../types';
import { chatApi } from '../services/chatApi';

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isConnected: false,
  isLoading: false,
  error: null,
  unreadCount: 0,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async () => {
    return await chatApi.getConversations();
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string) => {
    return await chatApi.getMessages(conversationId);
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (data: SendMessagePayload) => {
    return await chatApi.sendMessage(data);
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (data: CreateConversationPayload) => {
    return await chatApi.createConversation(data);
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async () => {
    return await chatApi.getUnreadCount();
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.activeConversation = action.payload;
      if (action.payload) {
        // Reset unread count for this conversation
        const conversation = state.conversations.find(c => c._id === action.payload._id);
        if (conversation) {
          conversation.unread_count = {};
        }
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      console.log('🔥 REDUX addMessage called for message:', action.payload._id);
      console.log('🔥 Message conversation_id:', action.payload.conversation_id);
      console.log('🔥 Current messages count BEFORE:', state.messages.length);
      
      // Check if message already exists to prevent duplicates (including temp messages)
      const messageExists = state.messages.some(
        (msg) => {
          // Check by real ID
          if (msg._id === action.payload._id || msg.id === action.payload._id) {
            console.log('🔥 Message EXISTS by ID - SKIPPING');
            return true;
          }
          // Check if this is replacing a temp message with same content (within 2 seconds)
          if (msg._id.startsWith('temp-') && 
              msg.content === action.payload.content &&
              msg.conversation_id === action.payload.conversation_id) {
            const msgTime = new Date(msg.created_at).getTime();
            const payloadTime = new Date(action.payload.created_at).getTime();
            if (Math.abs(msgTime - payloadTime) < 2000) {
              console.log('🔥 Message EXISTS as temp - SKIPPING');
              return true; // Skip adding, as we already have the temp/optimistic version
            }
          }
          return false;
        }
      );
      
      if (!messageExists) {
        console.log('✅ REDUX: ADDING NEW MESSAGE to state!');
        state.messages.push(action.payload);
        console.log('✅ REDUX: Messages count AFTER:', state.messages.length);
      } else {
        console.log('❌ REDUX: Message already exists, NOT adding');
      }
      
      // Update conversation's last message
      const conversation = state.conversations.find(c => c._id === action.payload.conversation_id);
      if (conversation) {
        conversation.last_message = {
          content: action.payload.content,
          sender_id: action.payload.sender_id,
          sender_name: action.payload.sender_name,
          created_at: action.payload.created_at,
        };
        conversation.last_message_at = action.payload.created_at;
      }
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
      }
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        // Don't set isLoading for background polling (prevents UI flicker)
        // state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Check if we actually have new messages (avoid unnecessary updates)
        const newMessages = action.payload;
        const currentMessageIds = new Set(state.messages.map(m => m._id));
        const hasNewMessages = newMessages.some(msg => !currentMessageIds.has(msg._id));
        
        if (hasNewMessages || state.messages.length !== newMessages.length) {
          // Preserve any temporary/optimistic messages
          const tempMessages = state.messages.filter(msg => msg._id.startsWith('temp-'));
          state.messages = [...action.payload, ...tempMessages];
        }
        // If no new messages, don't update state (prevents re-renders)
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      })
      
      // Send message
      .addCase(sendMessage.pending, (state, action) => {
        // Optimistic update - add message immediately with temporary ID
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempMessage: Message = {
          _id: tempId,
          conversation_id: action.meta.arg.conversation_id,
          sender_id: '', // Will be set by server
          sender_name: 'You',
          sender_email: '',
          content: action.meta.arg.content,
          message_type: action.meta.arg.message_type || 'text',
          is_read: true,
          is_edited: false,
          is_deleted: false,
          read_by: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log('⚡ REDUX - sendMessage.pending - Adding optimistic message:', tempMessage);
        console.log('⚡ REDUX - Messages count before:', state.messages.length);
        state.messages.push(tempMessage);
        console.log('⚡ REDUX - Messages count after:', state.messages.length);
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Find and replace the LAST temporary message (most recent)
        const tempMessageIndex = state.messages.length - 1;
        if (tempMessageIndex >= 0 && state.messages[tempMessageIndex]._id.startsWith('temp-')) {
          // Replace temporary message with real one
          state.messages[tempMessageIndex] = action.payload;
        } else {
          // If no temp message found (shouldn't happen), check for duplicates
          const messageExists = state.messages.some(
            (msg) => msg._id === action.payload._id
          );
          if (!messageExists) {
            state.messages.push(action.payload);
          }
        }
        
        // Update conversation's last message
        const conversation = state.conversations.find(c => c._id === action.payload.conversation_id);
        if (conversation) {
          conversation.last_message = {
            content: action.payload.content,
            sender_id: action.payload.sender_id,
            sender_name: action.payload.sender_name,
            created_at: action.payload.created_at,
          };
          conversation.last_message_at = action.payload.created_at;
        }
      })
      .addCase(sendMessage.rejected, (state, _action) => {
        // Remove the LAST temporary message on error
        const tempMessageIndex = state.messages.length - 1;
        if (tempMessageIndex >= 0 && state.messages[tempMessageIndex]._id.startsWith('temp-')) {
          state.messages.splice(tempMessageIndex, 1);
        }
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.activeConversation = action.payload;
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  setActiveConversation,
  addMessage,
  updateConversation,
  setConnectionStatus,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;

