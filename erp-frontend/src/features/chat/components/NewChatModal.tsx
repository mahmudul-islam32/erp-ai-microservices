import React, { useState, useEffect } from 'react';
import { Search, X, Users, Loader2 } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { authApi } from '../../../shared/api/client';
import { chatApi } from '../services/chatApi';
import { ordersApi } from '../../sales/services/ordersApi';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { UserRole } from '../../users/types';
import { toast } from 'sonner';

interface User {
  id: string;
  _id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
}

interface NewChatModalProps {
  currentUserId: string;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUserId,
  onClose,
  onConversationCreated,
}) => {
  const { user } = usePermissions();
  const isCustomer = user?.role === UserRole.CUSTOMER;
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentUserId, isCustomer, user?.id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.first_name.toLowerCase().includes(query) ||
          user.last_name.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      let allowedUserIds: Set<string> = new Set();
      
      // For customers, allow messaging:
      // 1. Users who created their orders
      // 2. Customer support users (ADMIN, MANAGER, EMPLOYEE, SUPER_ADMIN with sales access)
      if (isCustomer && user?.email) {
        try {
          // Backend automatically filters orders by customer email, so we don't need to pass customer_id
          // Just fetch orders without filters - backend will auto-filter for the logged-in customer
          const ordersResponse = await ordersApi.getAll({});
          const orders = ordersResponse.items || [];
          
          console.log('Fetched orders for customer:', orders.length, orders);
          
          // Collect unique user IDs from sales_rep_id and created_by
          if (orders.length === 0) {
            console.warn('No orders found for customer. Will only show customer support users.');
          } else {
            orders.forEach((order: any) => {
              console.log('Processing order:', order.order_number, {
                sales_rep_id: order.sales_rep_id,
                created_by: order.created_by
              });
              
              if (order.sales_rep_id) {
                allowedUserIds.add(order.sales_rep_id);
                console.log('Added sales_rep_id:', order.sales_rep_id);
              }
              if (order.created_by) {
                allowedUserIds.add(order.created_by);
                console.log('Added created_by:', order.created_by);
              }
            });
            
            console.log('Total allowed user IDs from orders:', Array.from(allowedUserIds));
          }
        } catch (error: any) {
          console.error('Failed to fetch customer orders:', error);
          // Don't return early - still show customer support users
          console.warn('Could not load order information. Showing customer support users only.');
        }
      }
      
      // Fetch users - use chat-eligible endpoint for customers, regular endpoint for others
      let allUsers: User[] = [];
      
      if (isCustomer) {
        // For customers, use the chat-eligible endpoint with user IDs from orders
        const userIdParams = Array.from(allowedUserIds).join(',');
        const endpoint = userIdParams 
          ? `/api/v1/users/chat-eligible?user_ids=${userIdParams}`
          : '/api/v1/users/chat-eligible';
        
        console.log('Fetching chat-eligible users for customer:', endpoint);
        
        try {
          const response = await authApi.get(endpoint);
          allUsers = response.data || [];
          console.log('Received chat-eligible users:', allUsers.length, allUsers.map(u => ({ id: u.id || u._id, email: u.email, role: u.role })));
        } catch (error: any) {
          console.error('Failed to fetch chat-eligible users:', error);
          toast.error('Failed to load users for chat');
          setUsers([]);
          setFilteredUsers([]);
          return;
        }
      } else {
        // For non-customers, use regular users endpoint
        const response = await authApi.get('/api/v1/users/');
        allUsers = response.data || [];
      }
      
      // Filter out current user
      let otherUsers = allUsers.filter(
        (user: User) => (user.id || user._id) !== currentUserId
      );
      
      console.log('Final users list:', otherUsers.length, otherUsers.map(u => ({ id: u.id || u._id, email: u.email, role: u.role })));
      
      // If no users found, show message
      if (otherUsers.length === 0) {
        if (isCustomer) {
          toast.info('No users available to message. You need customer support users or users who created your orders.');
        } else {
          toast.info('No users found');
        }
        setUsers([]);
        setFilteredUsers([]);
        return;
      }
      
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    
    // Auto-enable group mode if more than 1 user selected
    if (newSelection.size > 1) {
      setIsGroup(true);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (isGroup && !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setIsCreating(true);
      
      const participantIds = Array.from(selectedUsers);
      const conversationData = {
        participant_ids: participantIds,
        is_group: isGroup || participantIds.length > 1,
        name: isGroup ? groupName.trim() : undefined,
      };

      const conversation = await chatApi.createConversation(conversationData);
      
      toast.success(
        isGroup
          ? `Group "${groupName}" created`
          : 'Conversation started'
      );
      
      onConversationCreated(conversation._id);
      onClose();
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      toast.error(
        error.response?.data?.detail || 'Failed to create conversation'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getUserFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  };

  const selectedCount = selectedUsers.size;

  return (
    <Modal
      isOpen={true}
      title="New Conversation"
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-col h-[600px]">
        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Group Chat Toggle */}
          {selectedCount > 1 && (
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-slate-700">Create as group chat</span>
              </label>
              
              {isGroup && (
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>
          )}
        </div>

        {/* Selected Users */}
        {selectedCount > 0 && (
          <div className="px-4 py-3 bg-primary-50 border-b border-primary-200">
            <div className="flex items-center gap-2 text-sm text-primary-900">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Array.from(selectedUsers).map((userId) => {
                const user = users.find((u) => (u.id || u._id) === userId);
                if (!user) return null;
                
                return (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-primary-300 rounded-lg text-sm text-slate-700"
                  >
                    {getUserFullName(user)}
                    <button
                      onClick={() => toggleUserSelection(userId)}
                      className="hover:text-error-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="h-12 w-12 mx-auto text-slate-400 mb-2" />
              <p>No users found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const userId = user.id || user._id || '';
                const isSelected = selectedUsers.has(userId);
                
                return (
                  <button
                    key={userId}
                    onClick={() => toggleUserSelection(userId)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">
                              {getUserFullName(user)}
                            </h4>
                            <p className="text-sm text-slate-500 truncate">
                              {user.email}
                            </p>
                            {user.department && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {user.department} • {user.role}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button onClick={onClose} variant="secondary" disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedCount === 0 || isCreating || (isGroup && !groupName.trim())}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Start {isGroup ? 'Group ' : ''}Chat
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

