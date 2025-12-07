import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { fetchEmployee } from '../store/hrmSlice';
import { formatDistanceToNow, format } from 'date-fns';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { Button } from '../../../shared/components/ui/Button';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { Edit, Trash2 } from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentEmployee, loading } = useSelector((state: RootState) => state.hrm.employees);
  const { hasPermission } = usePermissions();
  
  const canEdit = hasPermission(Permission.HR_UPDATE);
  const canDelete = hasPermission(Permission.HR_DELETE);

  useEffect(() => {
    if (id) {
      dispatch(fetchEmployee(id));
    }
  }, [dispatch, id]);

  if (loading && !currentEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <button
          onClick={() => navigate('/dashboard/hrm/employees')}
          className="mt-4 text-primary-600 hover:text-primary-900"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full_time':
        return 'bg-blue-100 text-blue-800';
      case 'part_time':
        return 'bg-purple-100 text-purple-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      case 'intern':
        return 'bg-pink-100 text-pink-800';
      case 'freelance':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/dashboard/hrm/employees')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Employees
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {currentEmployee.first_name.charAt(0)}{currentEmployee.last_name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentEmployee.full_name || `${currentEmployee.first_name} ${currentEmployee.last_name}`}
                </h1>
                <p className="mt-1 text-sm text-gray-500">{currentEmployee.email}</p>
                <p className="text-xs text-gray-400">ID: {currentEmployee.employee_id}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/hrm/employees/${id}/edit`)}
                  leftIcon={<Edit className="h-4 w-4" />}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => navigate('/dashboard/hrm/employees')}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.full_name || `${currentEmployee.first_name} ${currentEmployee.last_name}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentEmployee.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.phone || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.date_of_birth
                      ? format(new Date(currentEmployee.date_of_birth), 'PPP')
                      : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {currentEmployee.gender?.replace('_', ' ') || 'Not provided'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Employment Information
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.department || 'Not assigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Position</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.position || 'Not assigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEmploymentTypeColor(
                        currentEmployee.employment_type
                      )}`}
                    >
                      {currentEmployee.employment_type.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        currentEmployee.status
                      )}`}
                    >
                      {currentEmployee.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.start_date
                      ? format(new Date(currentEmployee.start_date), 'PPP')
                      : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salary</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${currentEmployee.salary?.toLocaleString() || 'Not provided'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      {currentEmployee.address && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Street</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentEmployee.address.street}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.address.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">State</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.address.state}
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.address.postal_code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.address.country}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {currentEmployee.emergency_contact && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
          </div>
          <div className="px-6 py-6">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentEmployee.emergency_contact.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Relationship</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentEmployee.emergency_contact.relationship}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentEmployee.emergency_contact.phone}
                </dd>
              </div>
              {currentEmployee.emergency_contact.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {currentEmployee.emergency_contact.email}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Skills & Certifications */}
      {(currentEmployee.skills?.length > 0 || currentEmployee.certifications?.length > 0) && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Skills & Certifications</h3>
          </div>
          <div className="px-6 py-6">
            {currentEmployee.skills && currentEmployee.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {currentEmployee.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {currentEmployee.certifications && currentEmployee.certifications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {currentEmployee.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {currentEmployee.notes && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {currentEmployee.notes}
            </p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Metadata</h3>
        </div>
        <div className="px-6 py-6">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentEmployee.created_at
                  ? format(new Date(currentEmployee.created_at), 'PPpp')
                  : 'Not available'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Updated At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentEmployee.updated_at
                  ? format(new Date(currentEmployee.updated_at), 'PPpp')
                  : 'Not available'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

