import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { auditLogsApi } from '../services/usersApi';
import { AuditLog, AuditFilters } from '../types';
import { AuditFilters as AuditFiltersComponent } from '../components/AuditFilters';
import { DataTableContainer } from '../../../shared/components/ui';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePaginationSettings } from '../../../shared/hooks/usePaginationSettings';

export const AuditLogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { defaultItemsPerPage } = usePaginationSettings();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>({
    skip: 0,
    limit: defaultItemsPerPage,
    user_id: searchParams.get('user_id') || undefined,
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  // Read user_id from URL query parameters and apply to filters
  const url_user_id = searchParams.get('user_id');
  useEffect(() => {
    setFilters(prev => {
      // Only update if user_id from URL is different from current filter
      if (prev.user_id !== url_user_id) {
        return {
          ...prev,
          user_id: url_user_id || undefined,
          skip: 0,
        };
      }
      return prev;
    });
    
    if (url_user_id) {
      setCurrentPage(1);
    }
  }, [url_user_id]);

  // Initialize itemsPerPage and filters when settings load
  useEffect(() => {
    if (defaultItemsPerPage && itemsPerPage !== defaultItemsPerPage) {
      setItemsPerPage(defaultItemsPerPage);
      setFilters(prev => ({
        ...prev,
        limit: defaultItemsPerPage,
        skip: 0,
      }));
      setCurrentPage(1);
    }
  }, [defaultItemsPerPage]);

  // Update filters when pagination changes
  useEffect(() => {
    const skip = (currentPage - 1) * itemsPerPage;
    setFilters(prev => {
      // Only update if skip or limit actually changed
      if (prev.skip === skip && prev.limit === itemsPerPage) {
        return prev;
      }
      return {
        ...prev,
        skip,
        limit: itemsPerPage,
      };
    });
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user]);

  // Handle filter changes from AuditFilters component
  const handleFiltersChange = (newFilters: AuditFilters) => {
    // If filter fields changed (not just skip/limit), reset to page 1
    const filterFieldsChanged = 
      newFilters.action !== filters.action ||
      newFilters.resource !== filters.resource ||
      newFilters.status !== filters.status ||
      newFilters.user_id !== filters.user_id ||
      newFilters.start_date !== filters.start_date ||
      newFilters.end_date !== filters.end_date;
    
    if (filterFieldsChanged) {
      setCurrentPage(1);
      // Update skip to 0 when filters change, preserve limit
      setFilters({
        ...newFilters,
        skip: 0,
        limit: newFilters.limit || itemsPerPage,
      });
    } else {
      // Just pagination change, update filters normally
      setFilters({
        ...newFilters,
        limit: newFilters.limit || itemsPerPage,
      });
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Admins can see all audit logs, regular users only their own
      const data = isAdmin 
        ? await auditLogsApi.getAll(filters)
        : await auditLogsApi.getMyLogs(filters.limit || itemsPerPage);
      
      setLogs(data);
      
      // Estimate total items: if we got a full page, there might be more
      if (data.length === (filters.limit || itemsPerPage)) {
        // We got a full page, estimate there are more items
        setTotalItems((filters.skip || 0) + data.length + 1);
      } else {
        // We got less than a full page, so this is the total
        setTotalItems((filters.skip || 0) + data.length);
      }
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to load audit logs';
      toast.error(errorMessage);
      
      // If non-admin tries to access all logs, fallback to own logs
      if (error?.response?.status === 403 && isAdmin) {
        try {
          const myLogs = await auditLogsApi.getMyLogs(filters.limit || itemsPerPage);
          setLogs(myLogs);
          setTotalItems(myLogs.length);
        } catch (e) {
          // Ignore fallback error
        }
      } else {
        setLogs([]);
        setTotalItems(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csv = auditLogsApi.exportToCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Audit logs exported successfully');
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    if (action.includes('login')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: 'success' | 'failure') => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Audit Logs' : 'My Activity Log'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin 
              ? 'Track all user activities and system events'
              : 'View your activity history'}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Logs
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{logs.length}</p>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Successful</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logs.filter((l) => l.status === 'success').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-red-600"
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
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logs.filter((l) => l.status === 'failure').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Unique Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(logs.map((l) => l.user_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AuditFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Logs Table */}
      <DataTableContainer
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
        totalItems={totalItems}
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
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : logs.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
            <p className="mt-1 text-sm text-gray-500">
              No events have been logged yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'PPpp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource}
                      {log.resource_id && (
                        <span className="text-gray-500 text-xs ml-1">
                          (#{log.resource_id.slice(0, 8)})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableContainer>
    </div>
  );
};
