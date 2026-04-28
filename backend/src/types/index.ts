// User & Auth
export interface User {
  user_id: string;
  company_id: string;
  email: string;
  full_name: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  user_id: string;
  company_id: string;
  email: string;
  full_name: string;
  assigned_divisions: string[];
  roles: Role[];
}

export type Role = 'Foreman' | 'Worker' | 'PM' | 'PC' | 'PA' | 'Controls' | 'Div_Manager';

// Company & Organization
export interface Company {
  company_id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export interface Division {
  division_id: string;
  company_id: string;
  division_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  client_id: string;
  company_id: string;
  division_id: string;
  client_name: string;
  primary_contact?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

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

// Rates & Employees
export interface Employee {
  employee_id: string;
  project_id: string;
  employee_name: string;
  position_name: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyEmployee {
  employee_id: string;
  company_id: string;
  division_id: string;
  employee_name: string;
  employee_code: string;
  position_name: string;
  created_at: string;
  updated_at: string;
}

export interface PositionRate {
  rate_id: string;
  company_id: string;
  position_name: string;
  regular_rate: number;
  overtime_rate: number;
  travel_time_rate: number;
  blended_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectPositionRate {
  rate_id: string;
  project_id: string;
  position_name: string;
  regular_rate: number;
  overtime_rate: number;
  travel_time_rate: number;
  blended_rate?: number;
  created_at: string;
  updated_at: string;
}

// Cost Codes & Setup
export interface MasterCostCode {
  cost_code_id: string;
  company_id: string;
  description: string;
  cost_type: 'LABOUR' | 'EQUIPMENT' | 'MATERIAL' | 'FREIGHT';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingLine {
  billing_line_id: string;
  project_id: string;
  line_number: number;
  line_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCostCode {
  project_cost_code_id: string;
  project_id: string;
  cost_code_id: string;
  description: string;
  cost_type: 'LABOUR' | 'EQUIPMENT' | 'MATERIAL' | 'FREIGHT';
  billing_line_id: string;
  budget_allocated?: number;
  execution_phase?: string;
  jonas_cost_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  equipment_id: string;
  project_id: string;
  equipment_name: string;
  daily_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  cost_code_id?: string;
  created_at: string;
  updated_at: string;
}

// Daily Entries
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
  regular_rate: number;
  overtime_rate: number;
  travel_rate: number;
  regular_cost: number;
  overtime_cost: number;
  travel_cost: number;
  total_cost: number;
  comments?: string;
  entered_by?: string;
  entered_at: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
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
  entered_by?: string;
  entered_at: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
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
  entered_by?: string;
  entered_at: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

// Audit Trail
export interface AuditTrail {
  audit_id: string;
  entry_type: 'TIME' | 'EQUIPMENT' | 'MATERIAL';
  entry_id: string;
  changed_by: string;
  changed_at: string;
  field_changed: string;
  original_value?: string;
  new_value?: string;
  reason?: string;
  created_at: string;
}

// Budget & Dashboard
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

export interface DashboardMetrics {
  total_budget: number;
  total_actual: number;
  total_remaining: number;
  total_percent_used: number;
  project_count: number;
  active_projects: number;
  completed_projects: number;
}

export interface DailySummary {
  date: string;
  project_id: string;
  entries: {
    cost_code_id: string;
    description: string;
    entry_count: number;
    total_cost: number;
  }[];
  daily_total: number;
  month_to_date_total: number;
}

// FIWP (Future)
export interface ExecutionPhase {
  phase_id: string;
  project_id: string;
  phase_name: string;
  phase_number: number;
  predecessor_phase_id?: string;
  planned_start?: string;
  planned_finish?: string;
  budget_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface FIWPRegister {
  fiwp_id: string;
  project_id: string;
  fiwp_number: string;
  scope_description?: string;
  phase_id?: string;
  cost_code_id?: string;
  planned_hours?: number;
  actual_hours: number;
  status: 'PRE_PLANNED' | 'PENDING' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'CARRIED_OVER' | 'COMPLETE' | 'CANCELLED';
  percent_complete: number;
  lead_hand_id?: string;
  predecessor_fiwp_id?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthPayload;
}

export interface APIError {
  error: string;
  status: number;
  field?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Cost Type (from Jonas)
export interface CostType {
  cost_type_code: string;
  description: string;
  std_uom?: string;
  active: boolean;
}

// Role Permissions
export interface RolePermission {
  permission_id: string;
  role: Role;
  can_enter_time: boolean;
  can_enter_material: boolean;
  can_edit_rates: boolean;
  can_view_budget: boolean;
  can_lock: boolean;
  can_approve: boolean;
  can_export: boolean;
}

// Filter/Query params
export interface ProjectFilters {
  division_id?: string;
  client_id?: string;
  status?: 'active' | 'completed' | 'all';
  limit?: number;
  offset?: number;
}

export interface EntryFilters {
  date_from?: string;
  date_to?: string;
  entry_type?: 'time' | 'equipment' | 'material' | 'all';
  cost_code_id?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityLogFilters {
  date_from?: string;
  date_to?: string;
  activity_type?: string;
  limit?: number;
  offset?: number;
}
