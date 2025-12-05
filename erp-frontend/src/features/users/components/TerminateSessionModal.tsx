import React from 'react';
import { Session } from '../types';

interface TerminateSessionModalProps {
  session: Session;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const TerminateSessionModal: React.FC<TerminateSessionModalProps> = ({
  session,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={onCancel}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1 min-w-0">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Terminate Session
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 break-words">
                  Are you sure you want to terminate this session for{' '}
                  <strong className="break-all">{session.user_email}</strong>?
                </p>
                <div className="mt-3 text-xs text-gray-400 space-y-1 break-words">
                  <p className="break-all">IP Address: {session.ip_address || 'N/A'}</p>
                  <p className="break-words">Device: {session.user_agent || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50"
            >
              {loading ? 'Terminating...' : 'Terminate'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

