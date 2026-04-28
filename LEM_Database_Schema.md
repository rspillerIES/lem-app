# LEM App Database Schema

## Overview

This schema supports a multi-tenant, multi-division, multi-client, multi-project daily timesheet system with budget tracking, activity logging, and optional FIWP integration.

**Key Data Flows:**
1. **Company Setup** → Divisions → Clients (assigned to divisions) → Projects (assigned to clients)
2. **Position Rates** → Employees (assigned positions) → Daily Time Entries (pull rates from position)
3. **Budget Tiers** → Budget (allocated) + FIWP Hours (planned) + Actual (from daily entries) = Variance
4. **Daily Entry** → Employee → Position (auto) → Rates (auto-pull) → Cost Code → Hours → Cost

---

## Core Organization Tables

### `companies`
Represents the company (one per instance, but structure for multi-tenant future).

```sql
CREATE TABLE companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `divisions`
Operational divisions within the company (e.g., Industrial, Oil & Gas, Service).

```sql
CREATE TABLE divisions (
  division_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  division_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, division_name)
);

CREATE INDEX idx_divisions_company ON divisions(company_id);
```

### `clients`
Clients assigned to divisions.

```sql
CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  primary_contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_division ON clients(division_id);
```

### `projects`
Projects assigned to clients and divisions.

```sql
CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  project_number VARCHAR(50),
  po_number VARCHAR(50),
  po_value DECIMAL(12, 2) NOT NULL,
  budget_type ENUM('PROJECT', 'SERVICE') NOT NULL, -- PROJECT: per-CC budget, SERVICE: draw from total PO
  start_date DATE,
  end_date DATE,
  pm_name VARCHAR(255),
  foreman_name VARCHAR(255),
  division_manager_name VARCHAR(255),
  client_approval_date TIMESTAMP, -- When PM checked "Client Approved" checkbox
  client_approval_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_division ON projects(division_id);
CREATE INDEX idx_projects_company ON projects(company_id);
```

---

## User & Role Management

### `users`
Users in the system.

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);
```

### `user_divisions`
Maps users to divisions (a user can be in multiple divisions).

```sql
CREATE TABLE user_divisions (
  user_division_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, division_id)
);

CREATE INDEX idx_user_divisions_user ON user_divisions(user_id);
CREATE INDEX idx_user_divisions_division ON user_divisions(division_id);
```

### `default_role_permissions`
Company-level default role matrix (copied to all new projects).

```sql
CREATE TABLE default_role_permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'Foreman', 'Worker', 'PM', 'PC', 'PA', 'Controls', 'Div_Manager'
  can_enter_time BOOLEAN DEFAULT FALSE,
  can_enter_material BOOLEAN DEFAULT FALSE,
  can_edit_rates BOOLEAN DEFAULT FALSE,
  can_view_budget BOOLEAN DEFAULT FALSE,
  can_lock BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, role)
);

CREATE INDEX idx_default_permissions_company ON default_role_permissions(company_id);
```

### `project_role_permissions`
Project-specific role overrides (copied from defaults, PM can customize).

```sql
CREATE TABLE project_role_permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  can_enter_time BOOLEAN DEFAULT FALSE,
  can_enter_material BOOLEAN DEFAULT FALSE,
  can_edit_rates BOOLEAN DEFAULT FALSE,
  can_view_budget BOOLEAN DEFAULT FALSE,
  can_lock BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, role)
);

CREATE INDEX idx_project_permissions_project ON project_role_permissions(project_id);
```

---

## Rate & Employee Tables

### `master_cost_codes`
Global cost code master list (used by all projects).

```sql
CREATE TABLE master_cost_codes (
  cost_code_id VARCHAR(50) PRIMARY KEY, -- e.g., 'CC-001'
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  cost_type ENUM('LABOUR', 'EQUIPMENT', 'MATERIAL', 'FREIGHT') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_master_cc_company ON master_cost_codes(company_id);
```

### `position_rates` (Company-level)
Rate table by position (Regular, OT, Travel, Blended rates per position).

```sql
CREATE TABLE position_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  position_name VARCHAR(100) NOT NULL, -- e.g., 'Foreman', 'Journeyman', 'Laborer', '1st Year Apprentice'
  regular_rate DECIMAL(10, 2) NOT NULL, -- $/hour
  overtime_rate DECIMAL(10, 2) NOT NULL, -- $/hour
  travel_time_rate DECIMAL(10, 2) NOT NULL, -- $/hour
  blended_rate DECIMAL(10, 2), -- Optional, if used instead of REG/OT/Travel
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, position_name)
);

CREATE INDEX idx_position_rates_company ON position_rates(company_id);
```

### `project_position_rates` (Project-specific override, optional)
Allows project to override company-level position rates.

```sql
CREATE TABLE project_position_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  position_name VARCHAR(100) NOT NULL,
  regular_rate DECIMAL(10, 2) NOT NULL,
  overtime_rate DECIMAL(10, 2) NOT NULL,
  travel_time_rate DECIMAL(10, 2) NOT NULL,
  blended_rate DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, position_name)
);

CREATE INDEX idx_project_position_rates ON project_position_rates(project_id);
```

### `employees` (Project-specific)
Employees assigned to a project with their position.

```sql
CREATE TABLE employees (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  employee_name VARCHAR(255) NOT NULL,
  position_name VARCHAR(100) NOT NULL, -- e.g., 'Foreman', 'Laborer'
  -- Rates are auto-pulled from project_position_rates or position_rates (company-level) based on position_name
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, employee_name)
);

CREATE INDEX idx_employees_project ON employees(project_id);
```

### `billing_lines` (Project-specific)
Billing lines for a project (1-12 per project).

```sql
CREATE TABLE billing_lines (
  billing_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  line_number SMALLINT NOT NULL, -- 1-12
  line_name VARCHAR(255) NOT NULL, -- e.g., 'Site Services'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, line_number)
);

CREATE INDEX idx_billing_lines_project ON billing_lines(project_id);
```

### `project_cost_codes` (Project-specific allocation)
Cost codes added to a project with budget allocation.

```sql
CREATE TABLE project_cost_codes (
  project_cost_code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
  description VARCHAR(255),
  cost_type ENUM('LABOUR', 'EQUIPMENT', 'MATERIAL', 'FREIGHT') NOT NULL,
  billing_line_id UUID NOT NULL REFERENCES billing_lines(billing_line_id),
  budget_allocated DECIMAL(12, 2), -- Allocated budget for this CC (if PROJECT mode)
  execution_phase VARCHAR(100), -- Optional: Phase name from F220 (e.g., 'Phase 1 - Mobilization')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, cost_code_id)
);

CREATE INDEX idx_project_cc_project ON project_cost_codes(project_id);
CREATE INDEX idx_project_cc_cc ON project_cost_codes(cost_code_id);
```

### `equipment` (Project-specific)
Equipment available on a project.

```sql
CREATE TABLE equipment (
  equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  equipment_name VARCHAR(255) NOT NULL,
  daily_rate DECIMAL(10, 2), -- $/day
  weekly_rate DECIMAL(10, 2), -- $/week
  monthly_rate DECIMAL(10, 2), -- $/month
  cost_code_id VARCHAR(50) REFERENCES master_cost_codes(cost_code_id), -- Which CC to charge to
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, equipment_name)
);

CREATE INDEX idx_equipment_project ON equipment(project_id);
```

---

## Daily Entry Tables

### `daily_time_entries`
Labor time entries (one row per employee per cost code per date).

```sql
CREATE TABLE daily_time_entries (
  time_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  date_of_work DATE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(employee_id),
  cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
  position_name VARCHAR(100) NOT NULL, -- Denormalized from employee, for quick access to rates
  regular_hours DECIMAL(8, 2) DEFAULT 0,
  overtime_hours DECIMAL(8, 2) DEFAULT 0,
  travel_hours DECIMAL(8, 2) DEFAULT 0,
  regular_rate DECIMAL(10, 2), -- Rate at time of entry (snapshot)
  overtime_rate DECIMAL(10, 2),
  travel_rate DECIMAL(10, 2),
  regular_cost DECIMAL(12, 2), -- regular_hours × regular_rate (auto-calculated)
  overtime_cost DECIMAL(12, 2), -- overtime_hours × overtime_rate
  travel_cost DECIMAL(12, 2), -- travel_hours × travel_rate
  total_cost DECIMAL(12, 2), -- Sum of above (auto-calculated)
  comments TEXT,
  entered_by UUID REFERENCES users(user_id),
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE, -- Locked if client approved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_time_project ON daily_time_entries(project_id);
CREATE INDEX idx_daily_time_date ON daily_time_entries(date_of_work);
CREATE INDEX idx_daily_time_cc ON daily_time_entries(cost_code_id);
CREATE INDEX idx_daily_time_employee ON daily_time_entries(employee_id);
```

### `daily_equipment_entries`
Equipment usage entries.

```sql
CREATE TABLE daily_equipment_entries (
  equipment_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  date_of_work DATE NOT NULL,
  equipment_id UUID NOT NULL REFERENCES equipment(equipment_id),
  cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
  usage_type ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  quantity DECIMAL(8, 2) NOT NULL, -- Number of days/weeks/months
  rate DECIMAL(10, 2) NOT NULL, -- Rate at time of entry (snapshot)
  total_cost DECIMAL(12, 2), -- quantity × rate (auto-calculated)
  comments TEXT,
  entered_by UUID REFERENCES users(user_id),
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_equip_project ON daily_equipment_entries(project_id);
CREATE INDEX idx_daily_equip_date ON daily_equipment_entries(date_of_work);
CREATE INDEX idx_daily_equip_cc ON daily_equipment_entries(cost_code_id);
```

### `daily_material_entries`
Material invoice line items.

```sql
CREATE TABLE daily_material_entries (
  material_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  invoice_date DATE NOT NULL,
  invoice_po_number VARCHAR(50),
  vendor VARCHAR(255),
  description TEXT NOT NULL,
  cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
  billing_line_id UUID NOT NULL REFERENCES billing_lines(billing_line_id),
  amount DECIMAL(12, 2) NOT NULL,
  entered_by UUID REFERENCES users(user_id),
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_material_project ON daily_material_entries(project_id);
CREATE INDEX idx_daily_material_date ON daily_material_entries(invoice_date);
CREATE INDEX idx_daily_material_cc ON daily_material_entries(cost_code_id);
```

---

## Activity Log

### `activity_log`
Daily narrative notes: work performed, material ordered, material received, issues, etc.

```sql
CREATE TABLE activity_log (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  date_of_activity DATE NOT NULL,
  activity_type VARCHAR(50), -- 'WORK_PERFORMED', 'MATERIAL_ORDERED', 'MATERIAL_RECEIVED', 'OTHER'
  notes TEXT NOT NULL,
  entered_by UUID REFERENCES users(user_id),
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_project ON activity_log(project_id);
CREATE INDEX idx_activity_date ON activity_log(date_of_activity);
CREATE INDEX idx_activity_type ON activity_log(activity_type);
```

---

## Audit Trail (for Corrections)

### `audit_trail`
Tracks edits/corrections to locked entries.

```sql
CREATE TABLE audit_trail (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type VARCHAR(50) NOT NULL, -- 'TIME', 'EQUIPMENT', 'MATERIAL'
  entry_id UUID NOT NULL, -- time_entry_id, equipment_entry_id, or material_entry_id
  changed_by UUID NOT NULL REFERENCES users(user_id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  field_changed VARCHAR(100),
  original_value TEXT,
  new_value TEXT,
  reason TEXT, -- Why the change was made (required if entry is locked)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entry ON audit_trail(entry_type, entry_id);
CREATE INDEX idx_audit_user ON audit_trail(changed_by);
```

---

## Future FIWP Integration (Infrastructure, MVP Read-Only)

### `execution_phases` (F220 data, future)
Execution plan phases.

```sql
CREATE TABLE execution_phases (
  phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  phase_name VARCHAR(255) NOT NULL,
  phase_number SMALLINT,
  predecessor_phase_id UUID REFERENCES execution_phases(phase_id),
  planned_start DATE,
  planned_finish DATE,
  budget_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, phase_name)
);

CREATE INDEX idx_execution_phases_project ON execution_phases(project_id);
```

### `fiwp_register` (F240 + Register data, future)
FIWP activities and status tracking.

```sql
CREATE TABLE fiwp_register (
  fiwp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  fiwp_number VARCHAR(50), -- e.g., 'IMP-E-022'
  scope_description TEXT,
  phase_id UUID REFERENCES execution_phases(phase_id),
  cost_code_id VARCHAR(50) REFERENCES master_cost_codes(cost_code_id),
  planned_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PRE_PLANNED', -- PRE_PLANNED, PENDING, READY, IN_PROGRESS, BLOCKED, CARRIED_OVER, COMPLETE
  percent_complete DECIMAL(5, 2) DEFAULT 0,
  lead_hand_id UUID REFERENCES employees(employee_id),
  predecessor_fiwp_id UUID REFERENCES fiwp_register(fiwp_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fiwp_project ON fiwp_register(project_id);
CREATE INDEX idx_fiwp_status ON fiwp_register(status);
```

### `cost_code_fiwp_mapping` (Optional, future)
Maps cost codes to FIWP activities (for variance tracking).

```sql
CREATE TABLE cost_code_fiwp_mapping (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
  fiwp_id UUID NOT NULL REFERENCES fiwp_register(fiwp_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, cost_code_id, fiwp_id)
);

CREATE INDEX idx_cc_fiwp_project ON cost_code_fiwp_mapping(project_id);
```

---

## Key Calculation Queries (Budget Tiers)

### Three-Tier Budget View (per cost code)

```sql
-- For Project Dashboard: Budget | FIWP Hours | Actual

SELECT 
  pcc.project_cost_code_id,
  pcc.cost_code_id,
  pcc.description,
  pcc.budget_allocated AS "Budget",
  COALESCE(fr.planned_hours, 0) AS "FIWP_Hours",
  COALESCE(SUM(dte.total_cost), 0) AS "Actual",
  pcc.budget_allocated - COALESCE(SUM(dte.total_cost), 0) AS "Remaining",
  CASE 
    WHEN pcc.budget_allocated > 0 THEN 
      ROUND((COALESCE(SUM(dte.total_cost), 0) / pcc.budget_allocated * 100)::numeric, 1)
    ELSE 0 
  END AS "Percent_Used",
  CASE 
    WHEN COALESCE(fr.planned_hours, 0) > 0 THEN
      ROUND((COALESCE(SUM(dte.total_cost), 0) / COALESCE(fr.planned_hours, 1) * 100)::numeric, 1)
    ELSE 0
  END AS "Percent_of_FIWP"
FROM project_cost_codes pcc
LEFT JOIN fiwp_register fr ON pcc.project_id = fr.project_id AND pcc.cost_code_id = fr.cost_code_id
LEFT JOIN daily_time_entries dte ON pcc.project_id = dte.project_id AND pcc.cost_code_id = dte.cost_code_id
LEFT JOIN daily_equipment_entries dee ON pcc.project_id = dee.project_id AND pcc.cost_code_id = dee.cost_code_id
LEFT JOIN daily_material_entries dme ON pcc.project_id = dme.project_id AND pcc.cost_code_id = dme.cost_code_id
WHERE pcc.project_id = $1
GROUP BY pcc.project_cost_code_id, pcc.cost_code_id, pcc.description, pcc.budget_allocated, fr.planned_hours;
```

### Dashboard Aggregation (Overall view, all projects)

```sql
-- For Overall Dashboard: Total Budget, Actual, Remaining across all projects in divisions

SELECT 
  SUM(p.po_value) AS "Total_Budget",
  COALESCE(SUM(dte.total_cost + COALESCE(dee.total_cost, 0) + COALESCE(dme.amount, 0)), 0) AS "Total_Actual",
  SUM(p.po_value) - COALESCE(SUM(dte.total_cost + COALESCE(dee.total_cost, 0) + COALESCE(dme.amount, 0)), 0) AS "Total_Remaining"
FROM projects p
LEFT JOIN daily_time_entries dte ON p.project_id = dte.project_id
LEFT JOIN daily_equipment_entries dee ON p.project_id = dee.project_id
LEFT JOIN daily_material_entries dme ON p.project_id = dme.project_id
WHERE p.division_id IN ($1, $2, ...)
GROUP BY p.division_id;
```

---

## Constraints & Rules

### Integrity Constraints
- `daily_time_entries.position_name` must exist in `position_rates` or `project_position_rates`
- `daily_time_entries.cost_code_id` must exist in `project_cost_codes` for that project
- `daily_equipment_entries.cost_code_id` must exist in `project_cost_codes`
- `daily_material_entries.cost_code_id` must exist in `project_cost_codes`
- `cost_code_id` in `project_cost_codes` must exist in `master_cost_codes`
- `billing_line_id` in `project_cost_codes` must exist in `billing_lines` for that project
- `employee_id` must belong to the project's `employees` table

### Business Rules
- Once `client_approval_locked = TRUE`, entries cannot be edited directly (only via audit trail with reason)
- `position_name` in `daily_time_entries` is denormalized from `employees.position_name` for performance
- Rates (`regular_rate`, `overtime_rate`, `travel_rate`) are snapshots at entry time (never updated retroactively)
- Budget tiers calculate on-demand (no denormalization needed)

---

## Indexes (Performance)

**By table frequency:**
- High-frequency queries: `daily_time_entries`, `projects`, `project_cost_codes`
- Medium-frequency: `employees`, `equipment`, `daily_equipment_entries`, `activity_log`
- Low-frequency: Setup tables (`divisions`, `billing_lines`, etc.)

**Key indexes:**
```sql
-- Time entries by project, date, cost code
CREATE INDEX idx_daily_time_project_date_cc ON daily_time_entries(project_id, date_of_work, cost_code_id);

-- Material entries by project and cost code
CREATE INDEX idx_daily_material_project_cc ON daily_material_entries(project_id, cost_code_id);

-- Budget queries (by project and cost code)
CREATE INDEX idx_project_cc_project_cc ON project_cost_codes(project_id, cost_code_id);

-- Activity log queries
CREATE INDEX idx_activity_project_date ON activity_log(project_id, date_of_activity);

-- Audit trail queries
CREATE INDEX idx_audit_entry_type_id ON audit_trail(entry_type, entry_id);
```

---

## Summary

**Tables: 26**
- Organization: 4 (companies, divisions, clients, projects)
- Users & Roles: 5 (users, user_divisions, default_role_permissions, project_role_permissions)
- Rates & Employees: 8 (position_rates, project_position_rates, employees, master_cost_codes, project_cost_codes, billing_lines, equipment)
- Daily Entries: 3 (daily_time_entries, daily_equipment_entries, daily_material_entries)
- Activity & Audit: 2 (activity_log, audit_trail)
- FIWP Integration (Future): 4 (execution_phases, fiwp_register, cost_code_fiwp_mapping)

**Key Data Flows:**
1. Position → Employee → Rates (auto-pull into time entry)
2. Time Entry → Cost Code → Budget (three-tier calculation)
3. Daily Entry → Activity Log (narrative notes)
4. Locked Entry → Audit Trail (corrections with reason)
5. All → Overall/Client/Project Dashboards (aggregations)

**Ready for review. Any changes before we move to API design?**
