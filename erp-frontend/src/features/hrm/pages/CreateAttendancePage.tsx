import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { clockIn } from '../store/hrmSlice';
import { AttendanceForm } from '../components/AttendanceForm';
import { toast } from 'sonner';
import { attendanceApi } from '../services/hrmApi';

export const CreateAttendancePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.hrm.attendance);

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting attendance data:', data);
      
      // Backend expects clock_in_time as time type (HH:MM:SS format), not datetime
      // HTML time input gives us HH:MM, so we need to add seconds
      if (data.clock_in_time && data.date) {
        // Convert HH:MM to HH:MM:SS format for backend
        const clockInTime = data.clock_in_time.includes(':') 
          ? (data.clock_in_time.split(':').length === 2 
              ? `${data.clock_in_time}:00` 
              : data.clock_in_time)
          : data.clock_in_time;
        
        const result = await dispatch(clockIn({
          employeeId: data.employee_id,
          data: {
            clock_in_time: clockInTime, // Send just time, not datetime
            notes: data.notes,
          }
        }));

        if (clockIn.fulfilled.match(result)) {
          // If clock out time is provided, also clock out
          if (data.clock_out_time) {
            // Convert HH:MM to HH:MM:SS format for backend
            const clockOutTime = data.clock_out_time.includes(':') 
              ? (data.clock_out_time.split(':').length === 2 
                  ? `${data.clock_out_time}:00` 
                  : data.clock_out_time)
              : data.clock_out_time;
            
            try {
              await attendanceApi.clockOut(data.employee_id, {
                clock_out_time: clockOutTime, // Send just time, not datetime
                notes: data.notes,
              });
            } catch (error) {
              console.error('Error clocking out:', error);
              // Still show success for clock in
            }
          }
          
          toast.success('Attendance record created successfully');
          navigate('/dashboard/hrm/attendance');
        } else if (clockIn.rejected.match(result)) {
          console.error('Attendance creation failed:', result.error);
          const errorMessage = result.error?.message || 'Failed to create attendance record';
          toast.error(errorMessage);
        }
      } else {
        // If no clock-in time, just show error
        toast.error('Clock-in time is required');
      }
    } catch (error: any) {
      console.error('Error creating attendance:', error);
      const errorDetail = error?.response?.data?.detail || error?.message || 'Failed to create attendance record';
      toast.error(errorDetail);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/hrm/attendance');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/hrm/attendance')}
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
          Back to Attendance
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Attendance Record</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the information below to create a new attendance record
          </p>
        </div>

        <AttendanceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};





