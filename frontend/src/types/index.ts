// Auth & User
export interface AuthPayload {
  user_id: string;
  company_id: string;
  email: string;
  full_name: string;
  assigned_divisions: string[];
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthPayload;
}

// Project
export interface Project {
  project_id: string;
  company_id: string;
  client_id: string;
  division_id: string;
  project_name: string;
  project_number: string;
  po_number: string;
  po_value: number;
  budget_type: 'PROJECT' | 'SERVICE';
  start_date?: string;
  end_date?: string;
  pm_name?: string;
  foreman_name?: string;
  division_manager_name?: string;
  client_approval_locked: boolean;
  client_approval_date?: string;
  created_at: string;
  updated_at: string;
}

// Entries
export interface DailyTimeEntry {
  time_entry_id: string;
  project_id: string;
  date_of_work: string;
  employee_id: string;
  cost_code_id: string;
  position_name: string;
  regular_hours: number;
  overtime_hours: number;
  travel_hours: number;
  total_cost: number;
  regular_cost: number;
  overtime_cost: number;
  travel_cost: number;
  comments?: string;
  is_locked: boolean;
  created_at: string;
}

export interface DailyEquipmentEntry {
  equipment_entry_id: string;
  project_id: string;
  date_of_work: string;
  equipment_id: string;
  cost_code_id: string;
  usage_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  quantity: number;
  rate: number;
  total_cost: number;
  comments?: string;
  is_locked: boolean;
  created_at: string;
}

export interface DailyMaterialEntry {
  material_entry_id: string;
  project_id: string;
  invoice_date: string;
  invoice_po_number?: string;
  vendor?: string;
  description: string;
  cost_code_id: string;
  billing_line_id: string;
  amount: number;
  is_locked: boolean;
  created_at: string;
}

// Budget
export interface BudgetBreakdown {
  project_cost_code_id: string;
  cost_code_id: string;
  description: string;
  cost_type: string;
  execution_phase?: string;
  budget_allocated: number;
  fiwp_hours: number;
  actual_hours: number;
  actual_cost: number;
  remaining_budget: number;
  percent_used: number;
  percent_of_fiwp: number;
}

export interface ProjectBudgetResponse {
  cost_codes: BudgetBreakdown[];
  total_budget: number;
  total_actual: number;
  total_remaining: number;
  total_percent_used: number;
}

// Activity Log
export interface ActivityLog {
  activity_id: string;
  project_id: string;
  date_of_activity: string;
  activity_type: 'WORK_PERFORMED' | 'MATERIAL_ORDERED' | 'MATERIAL_RECEIVED' | 'OTHER';
  notes: string;
  entered_by?: string;
  entered_at: string;
  created_at: string;
}

// Dashboard
export interface DashboardMetrics {
  total_budget: number;
  total_actual: number;
  total_remaining: number;
  total_percent_used: number;
  project_count: number;
  active_projects: number;
  completed_projects: number;
}

// Setup/Config
export interface BillingLine {
  billing_line_id: string;
  project_id: string;
  line_number: number;
  line_name: string;
}

export interface Employee {
  employee_id: string;
  project_id: string;
  employee_name: string;
  position_name: string;
}

export interface Equipment {
  equipment_id: string;
  project_id: string;
  equipment_name: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
}

export interface PositionRate {
  rate_id: string;
  company_id: string;
  position_name: string;
  regular_rate: number;
  overtime_rate: number;
  travel_time_rate: number;
  blended_rate?: number;
}

// Form Data
export interface NewTimeEntryForm {
  date_of_work: string;
  employee_id: string;
  cost_code_id: string;
  regular_hours: number;
  overtime_hours: number;
  travel_hours: number;
  comments?: string;
}

export interface NewEquipmentEntryForm {
  date_of_work: string;
  equipment_id: string;
  cost_code_id: string;
  usage_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  quantity: number;
  comments?: string;
}

export interface NewMaterialEntryForm {
  invoice_date: string;
  invoice_po_number?: string;
  vendor?: string;
  description: string;
  cost_code_id: string;
  billing_line_id: string;
  amount: number;
}

export interface NewActivityForm {
  date_of_activity: string;
  activity_type: 'WORK_PERFORMED' | 'MATERIAL_ORDERED' | 'MATERIAL_RECEIVED' | 'OTHER';
  notes: string;
}

// API Responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
  status: number;
  field?: string;
  timestamp: string;
}
