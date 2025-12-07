import axios from 'axios';

const HRM_SERVICE_URL = import.meta.env.VITE_HRM_SERVICE_URL || 'http://localhost:8007';

const hrmApi = axios.create({
  baseURL: `${HRM_SERVICE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
hrmApi.interceptors.request.use(
  (config) => {
    console.log('🌐 HRM API Request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers
    });
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ HRM API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
hrmApi.interceptors.response.use(
  (response) => {
    console.log('✅ HRM API Response:', {
      url: response.config.url,
      status: response.status,
      dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ HRM API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Employee API
export const employeeApi = {
  // Get all employees
  getEmployees: async (params?: {
    skip?: number;
    limit?: number;
    department?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await hrmApi.get('/employees', { params });
    return response.data;
  },

  // Get employee by ID
  getEmployee: async (employeeId: string) => {
    const response = await hrmApi.get(`/employees/${employeeId}`);
    return response.data;
  },

  // Create employee
  createEmployee: async (employeeData: any) => {
    const response = await hrmApi.post('/employees', employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId: string, employeeData: any) => {
    const response = await hrmApi.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (employeeId: string) => {
    const response = await hrmApi.delete(`/employees/${employeeId}`);
    return response.data;
  },

  // Get employees by department
  getEmployeesByDepartment: async (department: string) => {
    const response = await hrmApi.get(`/employees/department/${department}`);
    return response.data;
  },

  // Get employee statistics
  getEmployeeStatistics: async () => {
    const response = await hrmApi.get('/employees/statistics/summary');
    return response.data;
  },
};

// Payroll API
export const payrollApi = {
  // Get all payrolls
  getPayrolls: async (params?: {
    skip?: number;
    limit?: number;
    employee_id?: string;
    status?: string;
    pay_period_start?: string;
    pay_period_end?: string;
  }) => {
    const response = await hrmApi.get('/payroll', { params });
    return response.data;
  },

  // Get payroll by ID
  getPayroll: async (payrollId: string) => {
    const response = await hrmApi.get(`/payroll/${payrollId}`);
    return response.data;
  },

  // Create payroll
  createPayroll: async (payrollData: any) => {
    const response = await hrmApi.post('/payroll', payrollData);
    return response.data;
  },

  // Update payroll
  updatePayroll: async (payrollId: string, payrollData: any) => {
    const response = await hrmApi.put(`/payroll/${payrollId}`, payrollData);
    return response.data;
  },

  // Approve payroll
  approvePayroll: async (payrollId: string) => {
    const response = await hrmApi.post(`/payroll/${payrollId}/approve`);
    return response.data;
  },

  // Get payroll summary
  getPayrollSummary: async (payPeriodStart: string, payPeriodEnd: string) => {
    const response = await hrmApi.get('/payroll/summary/period', {
      params: { pay_period_start: payPeriodStart, pay_period_end: payPeriodEnd }
    });
    return response.data;
  },

  // Delete payroll
  deletePayroll: async (payrollId: string) => {
    const response = await hrmApi.delete(`/payroll/${payrollId}`);
    return response.data;
  },
};

// Attendance API
export const attendanceApi = {
  // Get all attendance records
  getAttendanceRecords: async (params?: {
    skip?: number;
    limit?: number;
    employee_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const response = await hrmApi.get('/attendance', { params });
    return response.data;
  },

  // Clock in
  clockIn: async (employeeId: string, data?: {
    clock_in_time?: string;
    location?: string;
    notes?: string;
  }) => {
    const response = await hrmApi.post('/attendance/clock-in', {
      employee_id: employeeId,
      ...data
    });
    return response.data;
  },

  // Clock out
  clockOut: async (employeeId: string, data?: {
    clock_out_time?: string;
    location?: string;
    notes?: string;
  }) => {
    const response = await hrmApi.post('/attendance/clock-out', {
      employee_id: employeeId,
      ...data
    });
    return response.data;
  },

  // Get attendance for specific date
  getAttendance: async (employeeId: string, date: string) => {
    const response = await hrmApi.get(`/attendance/${employeeId}/${date}`);
    return response.data;
  },

  // Get attendance history
  getAttendanceHistory: async (employeeId: string, params: {
    start_date: string;
    end_date: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await hrmApi.get(`/attendance/${employeeId}/history`, { params });
    return response.data;
  },

  // Get timesheet
  getTimesheet: async (employeeId: string, weekStart: string) => {
    const response = await hrmApi.get(`/attendance/${employeeId}/timesheet`, {
      params: { week_start: weekStart }
    });
    return response.data;
  },

  // Get attendance summary
  getAttendanceSummary: async (employeeId: string, startDate: string, endDate: string) => {
    const response = await hrmApi.get(`/attendance/${employeeId}/summary`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },
};

// Leave API
export const leaveApi = {
  // Get all leave requests
  getLeaveRequests: async (params?: {
    skip?: number;
    limit?: number;
    employee_id?: string;
    status?: string;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await hrmApi.get('/leave', { params });
    return response.data;
  },

  // Get leave request by ID
  getLeaveRequest: async (leaveId: string) => {
    const response = await hrmApi.get(`/leave/${leaveId}`);
    return response.data;
  },

  // Create leave request
  createLeaveRequest: async (leaveData: any) => {
    const response = await hrmApi.post('/leave', leaveData);
    return response.data;
  },

  // Update leave request
  updateLeaveRequest: async (leaveId: string, leaveData: any) => {
    const response = await hrmApi.put(`/leave/${leaveId}`, leaveData);
    return response.data;
  },

  // Approve leave request
  approveLeaveRequest: async (leaveId: string, comments?: string) => {
    const response = await hrmApi.post(`/leave/${leaveId}/approve`, {
      comments
    });
    return response.data;
  },

  // Reject leave request
  rejectLeaveRequest: async (leaveId: string, rejectionReason: string) => {
    const response = await hrmApi.post(`/leave/${leaveId}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data;
  },

  // Get leave balance
  getLeaveBalance: async (employeeId: string) => {
    const response = await hrmApi.get(`/leave/${employeeId}/balance`);
    return response.data;
  },
};

// Performance API
export const performanceApi = {
  // Get all performance reviews
  getPerformanceReviews: async (params?: {
    skip?: number;
    limit?: number;
    employee_id?: string;
    reviewer_id?: string;
    status?: string;
    review_type?: string;
  }) => {
    const response = await hrmApi.get('/performance/reviews', { params });
    return response.data;
  },

  // Get performance review by ID
  getPerformanceReview: async (reviewId: string) => {
    const response = await hrmApi.get(`/performance/reviews/${reviewId}`);
    return response.data;
  },

  // Create performance review
  createPerformanceReview: async (reviewData: any) => {
    const response = await hrmApi.post('/performance/reviews', reviewData);
    return response.data;
  },

  // Update performance review
  updatePerformanceReview: async (reviewId: string, reviewData: any) => {
    const response = await hrmApi.put(`/performance/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Submit performance review
  submitPerformanceReview: async (reviewId: string) => {
    const response = await hrmApi.post(`/performance/reviews/${reviewId}/submit`);
    return response.data;
  },

  // Get performance summary
  getPerformanceSummary: async (employeeId: string) => {
    const response = await hrmApi.get(`/performance/${employeeId}/summary`);
    return response.data;
  },

  // Get performance analytics
  getPerformanceAnalytics: async (department?: string) => {
    const response = await hrmApi.get('/performance/analytics', {
      params: { department }
    });
    return response.data;
  },
};

// Recruitment API
export const recruitmentApi = {
  // Get all job postings
  getJobPostings: async (params?: {
    skip?: number;
    limit?: number;
    department?: string;
    status?: string;
    employment_type?: string;
  }) => {
    const response = await hrmApi.get('/recruitment/jobs', { params });
    return response.data;
  },

  // Get job posting by ID
  getJobPosting: async (jobId: string) => {
    const response = await hrmApi.get(`/recruitment/jobs/${jobId}`);
    return response.data;
  },

  // Create job posting
  createJobPosting: async (jobData: any) => {
    const response = await hrmApi.post('/recruitment/jobs', jobData);
    return response.data;
  },

  // Update job posting
  updateJobPosting: async (jobId: string, jobData: any) => {
    const response = await hrmApi.put(`/recruitment/jobs/${jobId}`, jobData);
    return response.data;
  },

  // Delete job posting
  deleteJobPosting: async (jobId: string) => {
    const response = await hrmApi.delete(`/recruitment/jobs/${jobId}`);
    return response.data;
  },

  // Get all applications
  getApplications: async (params?: {
    skip?: number;
    limit?: number;
    job_id?: string;
    status?: string;
  }) => {
    const response = await hrmApi.get('/recruitment/applications', { params });
    return response.data;
  },

  // Get application by ID
  getApplication: async (applicationId: string) => {
    const response = await hrmApi.get(`/recruitment/applications/${applicationId}`);
    return response.data;
  },

  // Create application
  createApplication: async (applicationData: any) => {
    const response = await hrmApi.post('/recruitment/applications', applicationData);
    return response.data;
  },

  // Update application
  updateApplication: async (applicationId: string, applicationData: any) => {
    const response = await hrmApi.put(`/recruitment/applications/${applicationId}`, applicationData);
    return response.data;
  },

  // Shortlist application
  shortlistApplication: async (applicationId: string) => {
    const response = await hrmApi.post(`/recruitment/applications/${applicationId}/shortlist`);
    return response.data;
  },

  // Reject application
  rejectApplication: async (applicationId: string, rejectionReason: string) => {
    const response = await hrmApi.post(`/recruitment/applications/${applicationId}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data;
  },

  // Get recruitment analytics
  getRecruitmentAnalytics: async (department?: string) => {
    const response = await hrmApi.get('/recruitment/analytics', {
      params: { department }
    });
    return response.data;
  },
};

// Training API
export const trainingApi = {
  // Get training programs
  getPrograms: async (params?: { skip?: number; limit?: number; category?: string; status?: string }) => {
    const response = await hrmApi.get('/training/programs', { params });
    return response.data;
  },
  // Get enrollments
  getEnrollments: async (params?: { skip?: number; limit?: number; employee_id?: string; training_program_id?: string; status?: string }) => {
    const response = await hrmApi.get('/training/enrollments', { params });
    return response.data;
  },
  // Get summary
  getSummary: async () => {
    const response = await hrmApi.get('/training/summary');
    return response.data;
  },
};

// Benefits API
export const benefitsApi = {
  // Get benefit plans
  getPlans: async (params?: { skip?: number; limit?: number; category?: string; status?: string }) => {
    const response = await hrmApi.get('/benefits/plans', { params });
    return response.data;
  },
  // Get benefit enrollments
  getEnrollments: async (params?: { skip?: number; limit?: number; employee_id?: string; plan_id?: string; status?: string }) => {
    const response = await hrmApi.get('/benefits/enrollments', { params });
    return response.data;
  },
  // Get summary
  getSummary: async () => {
    const response = await hrmApi.get('/benefits/summary');
    return response.data;
  },
};

// HR Analytics API
export const hrAnalyticsApi = {
  getDashboard: async (params?: { period_days?: number; department?: string }) => {
    const response = await hrmApi.get('/analytics/dashboard', { params });
    return response.data;
  },
};

export default hrmApi;
