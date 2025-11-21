import React, { useEffect } from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { 
  AcademicCapIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchTrainingPrograms, fetchTrainingEnrollments, fetchTrainingSummary } from '../store/hrmSlice';

export const TrainingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const training = useAppSelector((state) => state.hrm.training);

  useEffect(() => {
    dispatch(fetchTrainingPrograms());
    dispatch(fetchTrainingEnrollments());
    dispatch(fetchTrainingSummary());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
          <p className="text-gray-600">Manage employee training programs and development</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          New Training Program
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Programs</p>
              <p className="text-2xl font-semibold text-gray-900">{training.summary?.total_programs ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-semibold text-gray-900">{training.summary?.total_enrollments ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{training.summary?.completed_enrollments ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Certificates</p>
              <p className="text-2xl font-semibold text-gray-900">{training.summary?.completed_enrollments ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Training Programs Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Training Programs</h3>
        </div>
        <div className="overflow-x-auto">
          {training.loading ? (
            <div className="px-6 py-4 text-center text-gray-500">Loading...</div>
          ) : training.error ? (
            <div className="px-6 py-4 text-center text-red-600">Error: {training.error}</div>
          ) : training.programs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No training programs found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {training.programs.map((program: any) => (
                  <tr key={program.id || program._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{program.name || program.title}</div>
                      <div className="text-sm text-gray-500">{program.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.duration_hours || 0} hours</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.instructor || program.instructor_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        program.status === 'published' || program.status === 'active' ? 'bg-green-100 text-green-800' :
                        program.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrainingPage;