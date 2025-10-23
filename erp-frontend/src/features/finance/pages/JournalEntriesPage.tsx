import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus as PlusIcon, CheckCircle as CheckCircleIcon } from 'lucide-react';
import { journalEntriesApi } from '../services/financeApi';
import { JournalEntry, JournalEntryStatus } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const JournalEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JournalEntryStatus | 'all'>('all');

  useEffect(() => {
    loadEntries();
  }, [filter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await journalEntriesApi.getAll(params);
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (id: string) => {
    if (!confirm('Are you sure you want to post this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await journalEntriesApi.post(id);
      toast.success('Journal entry posted successfully');
      loadEntries();
    } catch (error) {
      console.error('Error posting journal entry:', error);
      toast.error('Failed to post journal entry');
    }
  };

  const getStatusColor = (status: JournalEntryStatus) => {
    const colors = {
      [JournalEntryStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
      [JournalEntryStatus.POSTED]: 'bg-green-100 text-green-800',
      [JournalEntryStatus.REVERSED]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Manage accounting transactions</p>
        </div>
        <Link
          to="/dashboard/finance/journal-entries/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as JournalEntryStatus | 'all')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value={JournalEntryStatus.DRAFT}>Draft</option>
          <option value={JournalEntryStatus.POSTED}>Posted</option>
          <option value={JournalEntryStatus.REVERSED}>Reversed</option>
        </select>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No journal entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Entry Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link to={`/dashboard/finance/journal-entries/${entry._id}`}>
                        {entry.entry_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{entry.description}</div>
                      {entry.reference && (
                        <div className="text-xs text-gray-500">Ref: {entry.reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${entry.total_debit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${entry.total_credit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {entry.status === JournalEntryStatus.DRAFT && (
                        <button
                          onClick={() => handlePostEntry(entry._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Post Entry"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

