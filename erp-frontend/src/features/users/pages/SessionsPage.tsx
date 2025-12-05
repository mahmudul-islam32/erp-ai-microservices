import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { logout, clearAuth } from '../../auth/store/authSlice';
import { sessionsApi } from '../services/usersApi';
import { Session } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { TerminateSessionModal } from '../components/TerminateSessionModal';
import { TerminateAllSessionsModal } from '../components/TerminateAllSessionsModal';
import { DataTableContainer } from '../../../shared/components/ui';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { defaultItemsPerPage } = usePaginationSettings();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sessionToTerminate, setSessionToTerminate] = useState<Session | null>(null);
  const [userToTerminateAll, setUserToTerminateAll] = useState<{ userId: string; userEmail: string; sessionCount?: number } | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // Update itemsPerPage when settings change
  useEffect(() => {
    if (defaultItemsPerPage && itemsPerPage !== defaultItemsPerPage) {
      setItemsPerPage(defaultItemsPerPage);
      setCurrentPage(1);
    }
  }, [defaultItemsPerPage]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterActive]);

  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Determine active filter
      const activeOnly = filterActive === true ? true : filterActive === false ? false : undefined;
      
      // Admins can see all sessions, regular users only their own
      const data = isAdmin 
        ? await sessionsApi.getAll(activeOnly)
        : await sessionsApi.getMySessions(activeOnly);
      
      // Ensure all sessions have an id field (handle both id and _id from backend)
      const normalizedSessions = data.map((session: any) => ({
        ...session,
        id: session.id || session._id || ''
      })).filter((session: any) => session.id); // Filter out sessions without valid IDs
      
      setSessions(normalizedSessions);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to load sessions';
      toast.error(errorMessage);
      
      // If non-admin tries to access all sessions, redirect to own sessions
      if (error?.response?.status === 403 && isAdmin) {
        try {
          const mySessions = await sessionsApi.getMySessions(filterActive === true ? true : filterActive === false ? false : undefined);
          // Normalize sessions to ensure id field exists
          const normalizedMySessions = mySessions.map((session: any) => ({
            ...session,
            id: session.id || session._id || ''
          })).filter((session: any) => session.id);
          setSessions(normalizedMySessions);
        } catch (e) {
          // Ignore fallback error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateClick = (session: Session) => {
    setSessionToTerminate(session);
  };

  const confirmTerminate = async () => {
    if (!sessionToTerminate) return;

    // Get session ID from either id or _id field
    const sessionId = sessionToTerminate.id || (sessionToTerminate as any)._id;
    
    if (!sessionId) {
      console.error('Session ID is missing:', sessionToTerminate);
      toast.error('Invalid session: missing session ID');
      setSessionToTerminate(null);
      return;
    }
    
    // Check if this is the current user's session
    const isCurrentUserSession = sessionToTerminate.user_id === user?.id;
    
    setIsTerminating(true);
    try {
      await sessionsApi.terminate(sessionId);
      toast.success('Session terminated successfully');
      
      // Close modal
      setSessionToTerminate(null);
      
      // Reload sessions to get updated list
      await loadSessions();
      
      // If this was the current user's session, check if they have any active sessions left
      if (isCurrentUserSession && user) {
        // Check active sessions for current user
        try {
          const activeSessions = await sessionsApi.getMySessions(true);
          
          // If no active sessions left, log out the user immediately
          if (activeSessions.length === 0) {
            toast.warning('All your sessions have been terminated. Logging out...');
            
            // Clear auth state and redirect to login
            dispatch(clearAuth());
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            setTimeout(() => {
              navigate('/login');
            }, 1000);
          }
        } catch (checkError) {
          // If we can't check sessions (maybe already logged out), just log out
          console.error('Error checking active sessions:', checkError);
          dispatch(clearAuth());
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        }
      }
    } catch (error: any) {
      console.error('Failed to terminate session:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to terminate session';
      toast.error(errorMessage);
      
      // If we get a 401, the user's session might have been terminated
      if (error?.response?.status === 401) {
        toast.warning('Your session has been terminated. Logging out...');
        dispatch(clearAuth());
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      }
    } finally {
      setIsTerminating(false);
    }
  };

  const handleTerminateAllClick = (userId: string, userEmail: string) => {
    // Count active sessions for this user
    const userSessions = sessions.filter(s => s.user_id === userId && s.is_active);
    setUserToTerminateAll({ userId, userEmail, sessionCount: userSessions.length });
  };

  const confirmTerminateAll = async () => {
    if (!userToTerminateAll) return;

    setIsTerminating(true);
    try {
      await sessionsApi.terminateAllForUser(userToTerminateAll.userId);
      toast.success('All sessions terminated successfully');
      
      // Close modal
      setUserToTerminateAll(null);
      
      // Reload sessions to get updated list
      await loadSessions();
      
      // If this was the current user, log them out immediately
      if (userToTerminateAll.userId === user?.id) {
        toast.warning('All your sessions have been terminated. Logging out...');
        
        // Clear auth state and redirect to login
        dispatch(clearAuth());
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to terminate sessions:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to terminate sessions';
      toast.error(errorMessage);
      
      // If we get a 401, the user's session might have been terminated
      if (error?.response?.status === 401) {
        toast.warning('Your session has been terminated. Logging out...');
        dispatch(clearAuth());
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      }
    } finally {
      setIsTerminating(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filterActive === null) return true;
    return session.is_active === filterActive;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterActive]);

  const activeSessions = sessions.filter(s => s.is_active).length;
  const inactiveSessions = sessions.filter(s => !s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Active Sessions' : 'My Sessions'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin 
            ? 'Monitor and manage active user sessions' 
            : 'View and manage your active sessions'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{inactiveSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <button
            onClick={() => setFilterActive(null)}
            className={`px-3 py-1 rounded-md text-sm ${
              filterActive === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-3 py-1 rounded-md text-sm ${
              filterActive === true
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-3 py-1 rounded-md text-sm ${
              filterActive === false
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <DataTableContainer
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSessions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isLoading={loading}
      >
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No user sessions are currently active.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.ip_address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {session.user_agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.is_active ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {session.is_active && (isAdmin || session.user_id === user?.id) && (
                        <button
                          onClick={() => handleTerminateClick(session)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableContainer>

      {/* Terminate Session Modal */}
      {sessionToTerminate && (
        <TerminateSessionModal
          session={sessionToTerminate}
          onConfirm={confirmTerminate}
          onCancel={() => setSessionToTerminate(null)}
          loading={isTerminating}
        />
      )}

      {/* Terminate All Sessions Modal */}
      {userToTerminateAll && (
        <TerminateAllSessionsModal
          userEmail={userToTerminateAll.userEmail}
          sessionCount={userToTerminateAll.sessionCount}
          onConfirm={confirmTerminateAll}
          onCancel={() => setUserToTerminateAll(null)}
          loading={isTerminating}
        />
      )}
    </div>
  );
};
