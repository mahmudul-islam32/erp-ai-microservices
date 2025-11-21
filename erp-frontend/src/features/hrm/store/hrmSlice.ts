import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { employeeApi, payrollApi, attendanceApi, leaveApi, performanceApi, recruitmentApi, trainingApi, benefitsApi, hrAnalyticsApi } from '../services/hrmApi';
import { Employee, Payroll, Attendance, Leave, PerformanceReview, HRDashboard } from '../types';

// Employee slice
interface EmployeeState {
  employees: Employee[];
  currentEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  statistics: any;
}

const initialEmployeeState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
  statistics: null,
};

export const fetchEmployees = createAsyncThunk(
  'hrm/fetchEmployees',
  async (params?: { skip?: number; limit?: number; department?: string; status?: string; search?: string }) => {
    const response = await employeeApi.getEmployees(params);
    return response;
  }
);

export const fetchEmployee = createAsyncThunk(
  'hrm/fetchEmployee',
  async (employeeId: string) => {
    const response = await employeeApi.getEmployee(employeeId);
    return response;
  }
);

export const createEmployee = createAsyncThunk(
  'hrm/createEmployee',
  async (employeeData: any) => {
    const response = await employeeApi.createEmployee(employeeData);
    return response;
  }
);

export const updateEmployee = createAsyncThunk(
  'hrm/updateEmployee',
  async ({ employeeId, employeeData }: { employeeId: string; employeeData: any }) => {
    const response = await employeeApi.updateEmployee(employeeId, employeeData);
    return response;
  }
);

export const deleteEmployee = createAsyncThunk(
  'hrm/deleteEmployee',
  async (employeeId: string) => {
    const response = await employeeApi.deleteEmployee(employeeId);
    return response;
  }
);

export const fetchEmployeeStatistics = createAsyncThunk(
  'hrm/fetchEmployeeStatistics',
  async () => {
    const response = await employeeApi.getEmployeeStatistics();
    return response;
  }
);

// Payroll slice
interface PayrollState {
  payrolls: Payroll[];
  currentPayroll: Payroll | null;
  loading: boolean;
  error: string | null;
  summary: any;
}

const initialPayrollState: PayrollState = {
  payrolls: [],
  currentPayroll: null,
  loading: false,
  error: null,
  summary: null,
};

export const fetchPayrolls = createAsyncThunk(
  'hrm/fetchPayrolls',
  async (params?: { skip?: number; limit?: number; employee_id?: string; status?: string; pay_period_start?: string; pay_period_end?: string }) => {
    const response = await payrollApi.getPayrolls(params);
    return response;
  }
);

export const fetchPayroll = createAsyncThunk(
  'hrm/fetchPayroll',
  async (payrollId: string) => {
    const response = await payrollApi.getPayroll(payrollId);
    return response;
  }
);

export const createPayroll = createAsyncThunk(
  'hrm/createPayroll',
  async (payrollData: any) => {
    const response = await payrollApi.createPayroll(payrollData);
    return response;
  }
);

export const updatePayroll = createAsyncThunk(
  'hrm/updatePayroll',
  async ({ payrollId, payrollData }: { payrollId: string; payrollData: any }) => {
    const response = await payrollApi.updatePayroll(payrollId, payrollData);
    return response;
  }
);

export const approvePayroll = createAsyncThunk(
  'hrm/approvePayroll',
  async (payrollId: string) => {
    const response = await payrollApi.approvePayroll(payrollId);
    return response;
  }
);

export const fetchPayrollSummary = createAsyncThunk(
  'hrm/fetchPayrollSummary',
  async ({ payPeriodStart, payPeriodEnd }: { payPeriodStart: string; payPeriodEnd: string }) => {
    const response = await payrollApi.getPayrollSummary(payPeriodStart, payPeriodEnd);
    return response;
  }
);

// Attendance slice
interface AttendanceState {
  attendance: Attendance[];
  currentAttendance: Attendance | null;
  timesheet: any;
  summary: any;
  loading: boolean;
  error: string | null;
}

const initialAttendanceState: AttendanceState = {
  attendance: [],
  currentAttendance: null,
  timesheet: null,
  summary: null,
  loading: false,
  error: null,
};

export const clockIn = createAsyncThunk(
  'hrm/clockIn',
  async ({ employeeId, data }: { employeeId: string; data?: any }) => {
    const response = await attendanceApi.clockIn(employeeId, data);
    return response;
  }
);

export const clockOut = createAsyncThunk(
  'hrm/clockOut',
  async ({ employeeId, data }: { employeeId: string; data?: any }) => {
    const response = await attendanceApi.clockOut(employeeId, data);
    return response;
  }
);

export const fetchAttendance = createAsyncThunk(
  'hrm/fetchAttendance',
  async ({ employeeId, date }: { employeeId: string; date: string }) => {
    const response = await attendanceApi.getAttendance(employeeId, date);
    return response;
  }
);

export const fetchAttendanceRecords = createAsyncThunk(
  'hrm/fetchAttendanceRecords',
  async (params?: { skip?: number; limit?: number; employee_id?: string; date_from?: string; date_to?: string }) => {
    const response = await attendanceApi.getAttendanceRecords(params);
    return response;
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'hrm/fetchAttendanceHistory',
  async ({ employeeId, params }: { employeeId: string; params: any }) => {
    const response = await attendanceApi.getAttendanceHistory(employeeId, params);
    return response;
  }
);

export const fetchTimesheet = createAsyncThunk(
  'hrm/fetchTimesheet',
  async ({ employeeId, weekStart }: { employeeId: string; weekStart: string }) => {
    const response = await attendanceApi.getTimesheet(employeeId, weekStart);
    return response;
  }
);

export const fetchAttendanceSummary = createAsyncThunk(
  'hrm/fetchAttendanceSummary',
  async ({ employeeId, startDate, endDate }: { employeeId: string; startDate: string; endDate: string }) => {
    const response = await attendanceApi.getAttendanceSummary(employeeId, startDate, endDate);
    return response;
  }
);

// Leave slice
interface LeaveState {
  leaves: Leave[];
  currentLeave: Leave | null;
  balance: any;
  loading: boolean;
  error: string | null;
}

const initialLeaveState: LeaveState = {
  leaves: [],
  currentLeave: null,
  balance: null,
  loading: false,
  error: null,
};

export const fetchLeaves = createAsyncThunk(
  'hrm/fetchLeaves',
  async (params?: { skip?: number; limit?: number; employee_id?: string; status?: string; leave_type?: string; start_date?: string; end_date?: string }) => {
    const response = await leaveApi.getLeaveRequests(params);
    return response;
  }
);

export const fetchLeave = createAsyncThunk(
  'hrm/fetchLeave',
  async (leaveId: string) => {
    const response = await leaveApi.getLeaveRequest(leaveId);
    return response;
  }
);

export const createLeave = createAsyncThunk(
  'hrm/createLeave',
  async (leaveData: any) => {
    const response = await leaveApi.createLeaveRequest(leaveData);
    return response;
  }
);

export const updateLeave = createAsyncThunk(
  'hrm/updateLeave',
  async ({ leaveId, leaveData }: { leaveId: string; leaveData: any }) => {
    const response = await leaveApi.updateLeaveRequest(leaveId, leaveData);
    return response;
  }
);

export const approveLeave = createAsyncThunk(
  'hrm/approveLeave',
  async ({ leaveId, comments }: { leaveId: string; comments?: string }) => {
    const response = await leaveApi.approveLeaveRequest(leaveId, comments);
    return response;
  }
);

export const rejectLeave = createAsyncThunk(
  'hrm/rejectLeave',
  async ({ leaveId, rejectionReason }: { leaveId: string; rejectionReason: string }) => {
    const response = await leaveApi.rejectLeaveRequest(leaveId, rejectionReason);
    return response;
  }
);

export const fetchLeaveBalance = createAsyncThunk(
  'hrm/fetchLeaveBalance',
  async (employeeId: string) => {
    const response = await leaveApi.getLeaveBalance(employeeId);
    return response;
  }
);

// Performance slice
interface PerformanceState {
  reviews: PerformanceReview[];
  currentReview: PerformanceReview | null;
  summary: any;
  analytics: any;
  loading: boolean;
  error: string | null;
}

const initialPerformanceState: PerformanceState = {
  reviews: [],
  currentReview: null,
  summary: null,
  analytics: null,
  loading: false,
  error: null,
};

export const fetchPerformanceReviews = createAsyncThunk(
  'hrm/fetchPerformanceReviews',
  async (params?: { skip?: number; limit?: number; employee_id?: string; reviewer_id?: string; status?: string; review_type?: string }) => {
    console.log('🚀 fetchPerformanceReviews - Starting API call');
    console.log('📋 Params:', params);
    console.log('🌐 API URL:', `${import.meta.env.VITE_HRM_SERVICE_URL || 'http://localhost:8007'}/api/v1/performance/reviews`);
    
    try {
      const response = await performanceApi.getPerformanceReviews(params);
      console.log('✅ fetchPerformanceReviews - API response received:', response);
      console.log('📊 Response length:', response?.length);
      console.log('👤 First review:', response?.[0]);
      return response;
    } catch (error) {
      console.error('❌ fetchPerformanceReviews - API error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }
);

export const fetchPerformanceReview = createAsyncThunk(
  'hrm/fetchPerformanceReview',
  async (reviewId: string) => {
    const response = await performanceApi.getPerformanceReview(reviewId);
    return response;
  }
);

export const createPerformanceReview = createAsyncThunk(
  'hrm/createPerformanceReview',
  async (reviewData: any) => {
    const response = await performanceApi.createPerformanceReview(reviewData);
    return response;
  }
);

export const updatePerformanceReview = createAsyncThunk(
  'hrm/updatePerformanceReview',
  async ({ reviewId, reviewData }: { reviewId: string; reviewData: any }) => {
    const response = await performanceApi.updatePerformanceReview(reviewId, reviewData);
    return response;
  }
);

export const submitPerformanceReview = createAsyncThunk(
  'hrm/submitPerformanceReview',
  async (reviewId: string) => {
    const response = await performanceApi.submitPerformanceReview(reviewId);
    return response;
  }
);

export const fetchPerformanceSummary = createAsyncThunk(
  'hrm/fetchPerformanceSummary',
  async (employeeId: string) => {
    const response = await performanceApi.getPerformanceSummary(employeeId);
    return response;
  }
);

export const fetchPerformanceAnalytics = createAsyncThunk(
  'hrm/fetchPerformanceAnalytics',
  async (department?: string) => {
    console.log('🚀 fetchPerformanceAnalytics - Starting API call');
    console.log('📋 Department:', department);
    console.log('🌐 API URL:', `${import.meta.env.VITE_HRM_SERVICE_URL || 'http://localhost:8007'}/api/v1/performance/analytics`);
    
    try {
      const response = await performanceApi.getPerformanceAnalytics(department);
      console.log('✅ fetchPerformanceAnalytics - API response received:', response);
      return response;
    } catch (error) {
      console.error('❌ fetchPerformanceAnalytics - API error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }
);

// Recruitment async thunks
export const fetchJobPostings = createAsyncThunk(
  'hrm/fetchJobPostings',
  async (params?: { skip?: number; limit?: number; department?: string; status?: string; employment_type?: string }) => {
    const response = await recruitmentApi.getJobPostings(params);
    return response;
  }
);

export const fetchJobPosting = createAsyncThunk(
  'hrm/fetchJobPosting',
  async (jobId: string) => {
    const response = await recruitmentApi.getJobPosting(jobId);
    return response;
  }
);

export const fetchApplications = createAsyncThunk(
  'hrm/fetchApplications',
  async (params?: { skip?: number; limit?: number; job_id?: string; status?: string }) => {
    const response = await recruitmentApi.getApplications(params);
    return response;
  }
);

export const fetchRecruitmentAnalytics = createAsyncThunk(
  'hrm/fetchRecruitmentAnalytics',
  async (department?: string) => {
    const response = await recruitmentApi.getRecruitmentAnalytics(department);
    return response;
  }
);

// Training thunks
export const fetchTrainingPrograms = createAsyncThunk(
  'hrm/fetchTrainingPrograms',
  async (params?: { skip?: number; limit?: number; category?: string; status?: string }) => {
    return await trainingApi.getPrograms(params);
  }
);

export const fetchTrainingEnrollments = createAsyncThunk(
  'hrm/fetchTrainingEnrollments',
  async (params?: { skip?: number; limit?: number; employee_id?: string; training_program_id?: string; status?: string }) => {
    return await trainingApi.getEnrollments(params);
  }
);

export const fetchTrainingSummary = createAsyncThunk('hrm/fetchTrainingSummary', async () => {
  return await trainingApi.getSummary();
});

// Benefits thunks
export const fetchBenefitPlans = createAsyncThunk(
  'hrm/fetchBenefitPlans',
  async (params?: { skip?: number; limit?: number; category?: string; status?: string }) => {
    return await benefitsApi.getPlans(params);
  }
);

export const fetchBenefitEnrollments = createAsyncThunk(
  'hrm/fetchBenefitEnrollments',
  async (params?: { skip?: number; limit?: number; employee_id?: string; plan_id?: string; status?: string }) => {
    return await benefitsApi.getEnrollments(params);
  }
);

export const fetchBenefitSummary = createAsyncThunk('hrm/fetchBenefitSummary', async () => {
  return await benefitsApi.getSummary();
});

// HR analytics (dashboard)
export const fetchHRDashboard = createAsyncThunk(
  'hrm/fetchHRDashboard',
  async (params?: { period_days?: number; department?: string }) => {
    return await hrAnalyticsApi.getDashboard(params);
  }
);

// Recruitment slice
interface RecruitmentState {
  jobPostings: any[];
  applications: any[];
  analytics: any;
  loading: boolean;
  error: string | null;
}

const initialRecruitmentState: RecruitmentState = {
  jobPostings: [],
  applications: [],
  analytics: null,
  loading: false,
  error: null,
};

// Combined HRM slice
interface HRMState {
  employees: EmployeeState;
  payroll: PayrollState;
  attendance: AttendanceState;
  leave: LeaveState;
  performance: PerformanceState;
  recruitment: RecruitmentState;
  training: {
    programs: any[];
    enrollments: any[];
    summary: any;
    loading: boolean;
    error: string | null;
  };
  benefits: {
    plans: any[];
    enrollments: any[];
    summary: any;
    loading: boolean;
    error: string | null;
  };
  dashboard: HRDashboard | null;
  loading: boolean;
  error: string | null;
}

const initialState: HRMState = {
  employees: initialEmployeeState,
  payroll: initialPayrollState,
  attendance: initialAttendanceState,
  leave: initialLeaveState,
  performance: initialPerformanceState,
  recruitment: initialRecruitmentState,
  training: {
    programs: [],
    enrollments: [],
    summary: null,
    loading: false,
    error: null,
  },
  benefits: {
    plans: [],
    enrollments: [],
    summary: null,
    loading: false,
    error: null,
  },
  dashboard: null,
  loading: false,
  error: null,
};

const hrmSlice = createSlice({
  name: 'hrm',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDashboard: (state, action: PayloadAction<HRDashboard>) => {
      state.dashboard = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Employee reducers
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.employees.loading = true;
        state.employees.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employees.loading = false;
        state.employees.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.employees.loading = false;
        state.employees.error = action.error.message || 'Failed to fetch employees';
      })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.employees.currentEmployee = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.employees.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.employees.findIndex(emp => emp.id === action.payload.id);
        if (index !== -1) {
          state.employees.employees[index] = action.payload;
        }
        if (state.employees.currentEmployee?.id === action.payload.id) {
          state.employees.currentEmployee = action.payload;
        }
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees.employees = state.employees.employees.filter(emp => emp.id !== action.meta.arg);
        if (state.employees.currentEmployee?.id === action.meta.arg) {
          state.employees.currentEmployee = null;
        }
      })
      .addCase(fetchEmployeeStatistics.fulfilled, (state, action) => {
        state.employees.statistics = action.payload;
      });

    // Payroll reducers
    builder
      .addCase(fetchPayrolls.pending, (state) => {
        state.payroll.loading = true;
        state.payroll.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.payroll.loading = false;
        state.payroll.payrolls = action.payload;
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.payroll.loading = false;
        state.payroll.error = action.error.message || 'Failed to fetch payrolls';
      })
      .addCase(fetchPayroll.fulfilled, (state, action) => {
        state.payroll.currentPayroll = action.payload;
      })
      .addCase(createPayroll.fulfilled, (state, action) => {
        state.payroll.payrolls.push(action.payload);
      })
      .addCase(updatePayroll.fulfilled, (state, action) => {
        const index = state.payroll.payrolls.findIndex(pay => pay.id === action.payload.id);
        if (index !== -1) {
          state.payroll.payrolls[index] = action.payload;
        }
        if (state.payroll.currentPayroll?.id === action.payload.id) {
          state.payroll.currentPayroll = action.payload;
        }
      })
      .addCase(approvePayroll.fulfilled, (state, action) => {
        const index = state.payroll.payrolls.findIndex(pay => pay.id === action.payload.id);
        if (index !== -1) {
          state.payroll.payrolls[index] = action.payload;
        }
        if (state.payroll.currentPayroll?.id === action.payload.id) {
          state.payroll.currentPayroll = action.payload;
        }
      })
      .addCase(fetchPayrollSummary.fulfilled, (state, action) => {
        state.payroll.summary = action.payload;
      });

    // Attendance reducers
    builder
      .addCase(clockIn.fulfilled, (state, action) => {
        state.attendance.currentAttendance = action.payload;
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.attendance.currentAttendance = action.payload;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendance.currentAttendance = action.payload;
      })
      .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
        state.attendance.attendance = action.payload;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.attendance.attendance = action.payload;
      })
      .addCase(fetchTimesheet.fulfilled, (state, action) => {
        state.attendance.timesheet = action.payload;
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.attendance.summary = action.payload;
      });

    // Leave reducers
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.leave.loading = true;
        state.leave.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leave.loading = false;
        state.leave.leaves = action.payload;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.leave.loading = false;
        state.leave.error = action.error.message || 'Failed to fetch leaves';
      })
      .addCase(fetchLeave.fulfilled, (state, action) => {
        state.leave.currentLeave = action.payload;
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.leave.leaves.push(action.payload);
      })
      .addCase(updateLeave.fulfilled, (state, action) => {
        const index = state.leave.leaves.findIndex(leave => leave.id === action.payload.id);
        if (index !== -1) {
          state.leave.leaves[index] = action.payload;
        }
        if (state.leave.currentLeave?.id === action.payload.id) {
          state.leave.currentLeave = action.payload;
        }
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        const index = state.leave.leaves.findIndex(leave => leave.id === action.payload.id);
        if (index !== -1) {
          state.leave.leaves[index] = action.payload;
        }
        if (state.leave.currentLeave?.id === action.payload.id) {
          state.leave.currentLeave = action.payload;
        }
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const index = state.leave.leaves.findIndex(leave => leave.id === action.payload.id);
        if (index !== -1) {
          state.leave.leaves[index] = action.payload;
        }
        if (state.leave.currentLeave?.id === action.payload.id) {
          state.leave.currentLeave = action.payload;
        }
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.leave.balance = action.payload;
      });

    // Performance reducers
    builder
      .addCase(fetchPerformanceReviews.pending, (state) => {
        state.performance.loading = true;
        state.performance.error = null;
      })
      .addCase(fetchPerformanceReviews.fulfilled, (state, action) => {
        state.performance.loading = false;
        state.performance.reviews = action.payload;
      })
      .addCase(fetchPerformanceReviews.rejected, (state, action) => {
        state.performance.loading = false;
        state.performance.error = action.error.message || 'Failed to fetch performance reviews';
      })
      .addCase(fetchPerformanceReview.fulfilled, (state, action) => {
        state.performance.currentReview = action.payload;
      })
      .addCase(createPerformanceReview.fulfilled, (state, action) => {
        state.performance.reviews.push(action.payload);
      })
      .addCase(updatePerformanceReview.fulfilled, (state, action) => {
        const index = state.performance.reviews.findIndex(review => review.id === action.payload.id);
        if (index !== -1) {
          state.performance.reviews[index] = action.payload;
        }
        if (state.performance.currentReview?.id === action.payload.id) {
          state.performance.currentReview = action.payload;
        }
      })
      .addCase(submitPerformanceReview.fulfilled, (state, action) => {
        const index = state.performance.reviews.findIndex(review => review.id === action.payload.id);
        if (index !== -1) {
          state.performance.reviews[index] = action.payload;
        }
        if (state.performance.currentReview?.id === action.payload.id) {
          state.performance.currentReview = action.payload;
        }
      })
      .addCase(fetchPerformanceSummary.fulfilled, (state, action) => {
        state.performance.summary = action.payload;
      })
      .addCase(fetchPerformanceAnalytics.pending, (state) => {
        state.performance.loading = true;
        state.performance.error = null;
      })
      .addCase(fetchPerformanceAnalytics.fulfilled, (state, action) => {
        state.performance.loading = false;
        state.performance.analytics = action.payload;
      })
      .addCase(fetchPerformanceAnalytics.rejected, (state, action) => {
        state.performance.loading = false;
        state.performance.error = action.error.message || 'Failed to fetch performance analytics';
      })
      // Recruitment reducers
      .addCase(fetchJobPostings.pending, (state) => {
        state.recruitment.loading = true;
        state.recruitment.error = null;
      })
      .addCase(fetchJobPostings.fulfilled, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.jobPostings = action.payload;
      })
      .addCase(fetchJobPostings.rejected, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.error = action.error.message || 'Failed to fetch job postings';
      })
      .addCase(fetchApplications.pending, (state) => {
        state.recruitment.loading = true;
        state.recruitment.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.error = action.error.message || 'Failed to fetch applications';
      })
      .addCase(fetchRecruitmentAnalytics.pending, (state) => {
        state.recruitment.loading = true;
        state.recruitment.error = null;
      })
      .addCase(fetchRecruitmentAnalytics.fulfilled, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.analytics = action.payload;
      })
      .addCase(fetchRecruitmentAnalytics.rejected, (state, action) => {
        state.recruitment.loading = false;
        state.recruitment.error = action.error.message || 'Failed to fetch recruitment analytics';
      });

    // Training reducers and thunks
    builder
      .addCase(fetchTrainingPrograms.pending, (state) => {
        state.training.loading = true;
        state.training.error = null;
      })
      .addCase(fetchTrainingPrograms.fulfilled, (state, action) => {
        state.training.loading = false;
        state.training.programs = action.payload;
      })
      .addCase(fetchTrainingPrograms.rejected, (state, action) => {
        state.training.loading = false;
        state.training.error = action.error.message || 'Failed to fetch training programs';
      })
      .addCase(fetchTrainingEnrollments.fulfilled, (state, action) => {
        state.training.enrollments = action.payload;
      })
      .addCase(fetchTrainingSummary.fulfilled, (state, action) => {
        state.training.summary = action.payload;
      });

    // Benefits reducers and thunks
    builder
      .addCase(fetchBenefitPlans.pending, (state) => {
        state.benefits.loading = true;
        state.benefits.error = null;
      })
      .addCase(fetchBenefitPlans.fulfilled, (state, action) => {
        state.benefits.loading = false;
        state.benefits.plans = action.payload;
      })
      .addCase(fetchBenefitPlans.rejected, (state, action) => {
        state.benefits.loading = false;
        state.benefits.error = action.error.message || 'Failed to fetch benefit plans';
      })
      .addCase(fetchBenefitEnrollments.fulfilled, (state, action) => {
        state.benefits.enrollments = action.payload;
      })
      .addCase(fetchBenefitSummary.fulfilled, (state, action) => {
        state.benefits.summary = action.payload;
      });

    // Dashboard analytics
    builder
      .addCase(fetchHRDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHRDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchHRDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch HR dashboard';
      });
  },
});

export const { clearError, setDashboard } = hrmSlice.actions;
export default hrmSlice.reducer;

// (moved thunks above to ensure availability during slice creation)
