// Employee Types
export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address: Address;
  emergency_contact: EmergencyContact;
  position: string;
  department: string;
  manager_id?: string;
  manager_name?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'freelance';
  start_date: string;
  end_date?: string;
  salary: number;
  bank_details?: BankDetails;
  skills: string[];
  certifications: string[];
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface BankDetails {
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
}

// Payroll Types
export interface Payroll {
  id: string;
  employee_id: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  basic_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  total_allowances: number;
  gross_earnings: number;
  income_tax: number;
  social_security: number;
  medicare: number;
  total_deductions: number;
  net_pay: number;
  status: 'draft' | 'pending' | 'approved' | 'processed' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Attendance Types
export interface Attendance {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  total_hours?: number;
  overtime_hours?: number;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day' | 'overtime';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  employee_id: string;
  employee_name: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  overtime_hours: number;
  entries: TimesheetEntry[];
  status: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
}

export interface TimesheetEntry {
  date: string;
  clock_in?: string;
  clock_out?: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  notes?: string;
}

// Leave Types
export interface Leave {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave' | 'bereavement_leave' | 'emergency_leave' | 'unpaid_leave' | 'compensatory_leave' | 'study_leave';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  emergency_contact?: string;
  work_handover?: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'taken' | 'expired';
  notes?: string;
  rejection_reason?: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  leave_type: string;
  total_entitlement: number;
  used_days: number;
  remaining_days: number;
  pending_days: number;
  expired_days: number;
}

export interface LeaveSummary {
  employee_id: string;
  employee_name: string;
  total_leave_days: number;
  used_leave_days: number;
  remaining_leave_days: number;
  pending_leave_days: number;
  leave_balance: LeaveBalance[];
}

// Performance Types
export interface PerformanceReview {
  id: string;
  employee_id: string;
  employee_name: string;
  reviewer_id: string;
  reviewer_name: string;
  review_period_start: string;
  review_period_end: string;
  review_type: string;
  categories: ReviewCategory[];
  goals: Goal[];
  employee_comments?: string;
  manager_comments?: string;
  hr_comments?: string;
  overall_rating?: 'excellent' | 'above_expectations' | 'meets_expectations' | 'below_expectations' | 'unsatisfactory';
  overall_score?: number;
  development_plan?: string;
  next_review_date?: string;
  status: 'draft' | 'in_progress' | 'pending_employee' | 'pending_manager' | 'pending_hr' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  completed_at?: string;
}

export interface ReviewCategory {
  name: string;
  description: string;
  weight: number;
  rating?: 'excellent' | 'above_expectations' | 'meets_expectations' | 'below_expectations' | 'unsatisfactory';
  comments?: string;
}

export interface Goal {
  title: string;
  description: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress_percentage: number;
  comments?: string;
}

// Recruitment Types
export interface JobPosting {
  id: string;
  job_id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_range_min?: number;
  salary_range_max?: number;
  currency: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills_required: string[];
  qualifications: string[];
  application_deadline?: string;
  start_date?: string;
  hiring_manager_id: string;
  hiring_manager_name: string;
  recruiter_id?: string;
  recruiter_name?: string;
  is_remote: boolean;
  is_urgent: boolean;
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  total_applications: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  closed_at?: string;
}

export interface Application {
  id: string;
  application_id: string;
  job_posting_id: string;
  job_title: string;
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_full_name: string;
  applicant_email: string;
  applicant_phone: string;
  resume_url: string;
  cover_letter?: string;
  expected_salary?: number;
  availability_date?: string;
  referral_source?: string;
  additional_documents: string[];
  status: 'applied' | 'screening' | 'interview_scheduled' | 'interview_completed' | 'shortlisted' | 'rejected' | 'offer_made' | 'accepted' | 'withdrawn';
  rejection_reason?: string;
  notes?: string;
  applied_at: string;
  updated_at: string;
  status_updated_at?: string;
}

// Training Types
export interface Training {
  id: string;
  training_id: string;
  title: string;
  description: string;
  category: string;
  training_type: 'mandatory' | 'optional' | 'certification' | 'skill_development' | 'compliance' | 'leadership' | 'technical';
  format: 'in_person' | 'online' | 'hybrid' | 'self_paced' | 'workshop' | 'seminar';
  duration_hours: number;
  max_participants?: number;
  prerequisites: string[];
  learning_objectives: string[];
  skills_covered: string[];
  instructor_id?: string;
  instructor_name?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  online_link?: string;
  materials: string[];
  cost?: number;
  is_mandatory: boolean;
  target_departments: string[];
  target_roles: string[];
  certification_validity_years?: number;
  passing_score?: number;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  total_enrollments: number;
  completed_enrollments: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  employee_name: string;
  training_id: string;
  training_title: string;
  enrollment_date: string;
  target_completion_date?: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'failed' | 'certified';
  progress_percentage: number;
  completion_date?: string;
  score?: number;
  certificate_url?: string;
  certificate_expiry_date?: string;
  feedback?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Benefits Types
export interface BenefitPlan {
  id: string;
  plan_id: string;
  name: string;
  benefit_type: 'health_insurance' | 'dental_insurance' | 'vision_insurance' | 'life_insurance' | 'disability_insurance' | 'retirement_401k' | 'retirement_pension' | 'vacation_days' | 'sick_days' | 'personal_days' | 'flexible_spending' | 'health_savings' | 'transportation' | 'meal_allowance' | 'gym_membership' | 'education_assistance' | 'child_care' | 'other';
  description: string;
  provider: string;
  coverage_type: 'individual' | 'family' | 'employee_plus_one' | 'employee_plus_children';
  employee_contribution: number;
  employer_contribution: number;
  total_cost: number;
  coverage_start_date: string;
  coverage_end_date?: string;
  eligibility_requirements: string[];
  waiting_period_days: number;
  enrollment_deadline?: string;
  is_mandatory: boolean;
  is_active: boolean;
  status: 'active' | 'inactive' | 'pending' | 'expired' | 'cancelled';
  total_enrollments: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBenefit {
  id: string;
  employee_id: string;
  employee_name: string;
  plan_id: string;
  plan_name: string;
  benefit_type: string;
  enrollment_date: string;
  coverage_start_date: string;
  coverage_end_date?: string;
  employee_contribution: number;
  employer_contribution: number;
  total_cost: number;
  dependents: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface HRAnalytics {
  id: string;
  metric_type: string;
  period_start: string;
  period_end: string;
  time_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  department?: string;
  value: number;
  target_value?: number;
  variance?: number;
  percentage_change?: number;
  metadata: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HRDashboard {
  period_start: string;
  period_end: string;
  total_employees: number;
  new_hires: number;
  terminations: number;
  turnover_rate: number;
  average_satisfaction: number;
  average_performance: number;
  attendance_rate: number;
  training_completion_rate: number;
  recruitment_efficiency: number;
  total_payroll_cost: number;
  benefits_utilization: number;
  key_metrics: Array<{name: string; value: number; trend: string}>;
  alerts: string[];
  trends: Array<{metric: string; value: number; change: number}>;
}
