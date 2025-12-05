import React, { useEffect, useState } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { useNotifications } from '../useNotifications';
import { NotificationItem } from '../components/NotificationItem';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { toast } from 'sonner';

type FilterType = 'all' | 'unread';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all notifications (not just unread) when page loads
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success('Notifications refreshed');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      toast.error('Failed to refresh notifications');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const emptyMessage = filter === 'unread' 
    ? 'No unread notifications'
    : 'No notifications yet';

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? 'Marking...' : 'Mark all as read'}
              </Button>
            )}
          </div>
        }
      />

      <Card padding="none" shadow="sm">
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === 'unread'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center text-lg font-medium">
                {emptyMessage}
              </p>
              {filter === 'unread' && notifications.length > 0 && (
                <p className="text-gray-400 text-center text-sm mt-2">
                  All your notifications have been read
                </p>
              )}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

