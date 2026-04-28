# LEM App REST API Specification

## Overview

Base URL: `http://localhost:3001/api`

All endpoints require authentication via Bearer token (JWT). All responses are JSON unless otherwise specified.

---

## Authentication & Authorization

### POST /auth/login
**Public endpoint (no auth required)**

Log in and receive JWT token.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "uuid-123",
    "email": "user@company.com",
    "full_name": "John Doe",
    "assigned_divisions": ["division-uuid-1", "division-uuid-2"],
    "roles": ["Foreman", "PM"]
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

## Employee Codes (Company/Division-Level Master Data)

### GET /employees
Get all employees for the user's assigned divisions.

**Query Parameters:**
- `division_id` (optional): Filter by division
- `position_name` (optional): Filter by position (e.g., "Foreman", "Laborer")
- `limit` (default 100): Pagination limit
- `offset` (default 0): Pagination offset

**Response (200):**
```json
{
  "employees": [
    {
      "employee_id": "uuid-123",
      "company_id": "uuid-comp-1",
      "division_id": "uuid-div-1",
      "employee_name": "Mike Johnson",
      "employee_code": "KAMMU", // Auto-generated or manually assigned
      "position_name": "Foreman",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-27T14:30:00Z"
    },
    {
      "employee_id": "uuid-124",
      "company_id": "uuid-comp-1",
      "division_id": "uuid-div-1",
      "employee_name": "Sarah Chen",
      "employee_code": "SARCHE",
      "position_name": "Journeyman",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-27T14:30:00Z"
    }
  ],
  "total": 47,
  "limit": 100,
  "offset": 0
}
```

### POST /employees
Create a new employee (company/division-level).

**Auth Required:** Admin or PM role

**Request:**
```json
{
  "company_id": "uuid-comp-1",
  "division_id": "uuid-div-1",
  "employee_name": "Mike Johnson",
  "employee_code": "KAMMU", // Optional, auto-generate if blank
  "position_name": "Foreman"
}
```

**Response (201):**
```json
{
  "employee_id": "uuid-123",
  "employee_name": "Mike Johnson",
  "employee_code": "KAMMU",
  "position_name": "Foreman",
  "created_at": "2026-04-27T14:30:00Z"
}
```

**Error (400):**
```json
{
  "error": "Employee code must be unique within division",
  "field": "employee_code"
}
```

### PUT /employees/:employeeId
Update employee details.

**Auth Required:** Admin or PM

**Request:**
```json
{
  "employee_name": "Mike Johnson Jr.",
  "position_name": "Sub Foreman"
}
```

**Response (200):**
```json
{
  "employee_id": "uuid-123",
  "employee_name": "Mike Johnson Jr.",
  "employee_code": "KAMMU",
  "position_name": "Sub Foreman",
  "updated_at": "2026-04-27T15:00:00Z"
}
```

### DELETE /employees/:employeeId
Soft delete (mark inactive).

**Auth Required:** Admin

**Response (204 No Content)**

---

## Cost Type Codes (from Jonas)

### GET /cost-types
Get active cost type codes for the company.

**Query Parameters:**
- `active_only` (default true): Include only active codes

**Response (200):**
```json
{
  "cost_types": [
    {
      "cost_type_code": "L",
      "description": "Labour",
      "std_uom": "Hrs",
      "active": true
    },
    {
      "cost_type_code": "E",
      "description": "Equipment",
      "std_uom": "E",
      "active": true
    },
    {
      "cost_type_code": "M",
      "description": "Purchase-Non Inventory",
      "std_uom": "E",
      "active": true
    },
    {
      "cost_type_code": "F",
      "description": "Freight",
      "std_uom": "E",
      "active": true
    }
  ]
}
```

### POST /cost-types
Create or update cost type codes (admin only, synced from Jonas).

**Auth Required:** Admin

**Request:**
```json
{
  "cost_type_code": "LO",
  "description": "LOA",
  "std_uom": "DAY",
  "active": true
}
```

**Response (201):**
```json
{
  "cost_type_code": "LO",
  "description": "LOA",
  "std_uom": "DAY",
  "active": true
}
```

---

## Position Rates (Company-Level Master)

### GET /position-rates
Get position rates for the company.

**Response (200):**
```json
{
  "position_rates": [
    {
      "rate_id": "uuid-rate-1",
      "company_id": "uuid-comp-1",
      "position_name": "Foreman",
      "regular_rate": 65.00,
      "overtime_rate": 97.50,
      "travel_time_rate": 32.50,
      "blended_rate": null,
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-27T14:30:00Z"
    },
    {
      "rate_id": "uuid-rate-2",
      "company_id": "uuid-comp-1",
      "position_name": "Journeyman",
      "regular_rate": 45.00,
      "overtime_rate": 67.50,
      "travel_time_rate": 22.50,
      "blended_rate": null,
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

### POST /position-rates
Create or update position rates.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "position_name": "Foreman",
  "regular_rate": 65.00,
  "overtime_rate": 97.50,
  "travel_time_rate": 32.50,
  "blended_rate": null
}
```

**Response (201):**
```json
{
  "rate_id": "uuid-rate-1",
  "position_name": "Foreman",
  "regular_rate": 65.00,
  "overtime_rate": 97.50,
  "travel_time_rate": 32.50,
  "created_at": "2026-04-27T14:30:00Z"
}
```

---

## Projects

### GET /projects
Get all projects user has access to (filtered by assigned divisions).

**Query Parameters:**
- `division_id` (optional): Filter by division
- `client_id` (optional): Filter by client
- `status` (optional): 'active', 'completed', 'all' (default: 'active')
- `limit` (default 50): Pagination
- `offset` (default 0): Pagination

**Response (200):**
```json
{
  "projects": [
    {
      "project_id": "uuid-proj-1",
      "company_id": "uuid-comp-1",
      "client_id": "uuid-client-1",
      "division_id": "uuid-div-1",
      "project_name": "F410 - Rosetown Site",
      "project_number": "F410",
      "client_name": "ABC Energy",
      "po_number": "12459",
      "po_value": 45000.00,
      "budget_type": "PROJECT",
      "start_date": "2026-04-01",
      "end_date": "2026-06-30",
      "pm_name": "Jane Smith",
      "foreman_name": "Mike Johnson",
      "client_approval_locked": false,
      "client_approval_date": null,
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-27T14:30:00Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

### POST /projects
Create a new project.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "client_id": "uuid-client-1",
  "division_id": "uuid-div-1",
  "project_name": "F410 - Rosetown Site",
  "project_number": "F410",
  "po_number": "12459",
  "po_value": 45000.00,
  "budget_type": "PROJECT",
  "start_date": "2026-04-01",
  "end_date": "2026-06-30",
  "pm_name": "Jane Smith",
  "foreman_name": "Mike Johnson"
}
```

**Response (201):**
```json
{
  "project_id": "uuid-proj-1",
  "project_name": "F410 - Rosetown Site",
  "po_value": 45000.00,
  "budget_type": "PROJECT",
  "created_at": "2026-04-27T14:30:00Z"
}
```

### GET /projects/:projectId
Get project details with full configuration.

**Response (200):**
```json
{
  "project": {
    "project_id": "uuid-proj-1",
    "project_name": "F410 - Rosetown Site",
    "project_number": "F410",
    "po_number": "12459",
    "po_value": 45000.00,
    "budget_type": "PROJECT",
    "start_date": "2026-04-01",
    "end_date": "2026-06-30",
    "pm_name": "Jane Smith",
    "foreman_name": "Mike Johnson",
    "client_approval_locked": false,
    "client_approval_date": null
  },
  "billing_lines": [
    {
      "billing_line_id": "uuid-bl-1",
      "line_number": 1,
      "line_name": "Site Services"
    },
    {
      "billing_line_id": "uuid-bl-2",
      "line_number": 2,
      "line_name": "Equipment Rental"
    },
    {
      "billing_line_id": "uuid-bl-3",
      "line_number": 3,
      "line_name": "Materials"
    }
  ],
  "cost_codes": [
    {
      "project_cost_code_id": "uuid-pcc-1",
      "cost_code_id": "CC-001",
      "description": "Labor - Field",
      "cost_type": "LABOUR",
      "billing_line_id": "uuid-bl-1",
      "budget_allocated": 10000.00,
      "execution_phase": "Phase 1 - Mobilization",
      "jonas_cost_type": "L"
    },
    {
      "project_cost_code_id": "uuid-pcc-2",
      "cost_code_id": "CC-002",
      "description": "Equipment - Excavator",
      "cost_type": "EQUIPMENT",
      "billing_line_id": "uuid-bl-2",
      "budget_allocated": 5000.00,
      "execution_phase": "Phase 1 - Mobilization",
      "jonas_cost_type": "E"
    }
  ],
  "employees": [
    {
      "employee_id": "uuid-emp-1",
      "employee_name": "Mike Johnson",
      "employee_code": "KAMMU",
      "position_name": "Foreman"
    }
  ],
  "position_rates": [
    {
      "rate_id": "uuid-rate-1",
      "position_name": "Foreman",
      "regular_rate": 65.00,
      "overtime_rate": 97.50,
      "travel_time_rate": 32.50
    }
  ],
  "equipment": [
    {
      "equipment_id": "uuid-eq-1",
      "equipment_name": "Excavator CAT 320",
      "daily_rate": 400.00,
      "weekly_rate": 1800.00,
      "monthly_rate": 6500.00,
      "cost_code_id": "CC-002"
    }
  ],
  "role_permissions": [
    {
      "role": "Foreman",
      "can_enter_time": true,
      "can_enter_material": false,
      "can_edit_rates": false,
      "can_view_budget": true,
      "can_lock": false,
      "can_approve": false,
      "can_export": false
    }
  ]
}
```

### POST /projects/:projectId/setup/billing-lines
Add or update billing lines for a project.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "billing_lines": [
    {
      "line_number": 1,
      "line_name": "Site Services"
    },
    {
      "line_number": 2,
      "line_name": "Equipment Rental"
    }
  ]
}
```

**Response (201):**
```json
{
  "billing_lines": [
    {
      "billing_line_id": "uuid-bl-1",
      "line_number": 1,
      "line_name": "Site Services"
    }
  ]
}
```

### POST /projects/:projectId/setup/cost-codes
Add cost codes to a project.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "cost_codes": [
    {
      "cost_code_id": "CC-001",
      "description": "Labor - Field",
      "cost_type": "LABOUR",
      "billing_line_id": "uuid-bl-1",
      "budget_allocated": 10000.00,
      "execution_phase": "Phase 1 - Mobilization",
      "jonas_cost_type": "L"
    },
    {
      "cost_code_id": "CC-002",
      "description": "Equipment - Excavator",
      "cost_type": "EQUIPMENT",
      "billing_line_id": "uuid-bl-2",
      "budget_allocated": 5000.00,
      "execution_phase": "Phase 1 - Mobilization",
      "jonas_cost_type": "E"
    }
  ]
}
```

**Response (201):**
```json
{
  "cost_codes": [
    {
      "project_cost_code_id": "uuid-pcc-1",
      "cost_code_id": "CC-001",
      "budget_allocated": 10000.00
    }
  ]
}
```

### POST /projects/:projectId/setup/employees
Assign employees to a project.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "employee_ids": ["uuid-emp-1", "uuid-emp-2", "uuid-emp-3"]
}
```

**Response (201):**
```json
{
  "employees": [
    {
      "employee_id": "uuid-emp-1",
      "employee_name": "Mike Johnson",
      "employee_code": "KAMMU",
      "position_name": "Foreman"
    }
  ]
}
```

### POST /projects/:projectId/setup/copy-rates
Copy position rates from another project (with optional adjustment).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "source_project_id": "uuid-proj-old",
  "adjust_rates": true,
  "adjustments": [
    {
      "position_name": "Foreman",
      "regular_rate": 70.00, // New rate (optional, can skip to keep source)
      "overtime_rate": 105.00,
      "travel_time_rate": 35.00
    }
  ]
}
```

**Response (201):**
```json
{
  "position_rates": [
    {
      "rate_id": "uuid-new-rate-1",
      "position_name": "Foreman",
      "regular_rate": 70.00,
      "overtime_rate": 105.00,
      "travel_time_rate": 35.00
    }
  ]
}
```

### POST /projects/:projectId/setup/copy-equipment
Copy equipment list from another project (same rates, no adjustment).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "source_project_id": "uuid-proj-old"
}
```

**Response (201):**
```json
{
  "equipment": [
    {
      "equipment_id": "uuid-eq-1",
      "equipment_name": "Excavator CAT 320",
      "daily_rate": 400.00,
      "weekly_rate": 1800.00,
      "monthly_rate": 6500.00,
      "cost_code_id": "CC-002"
    }
  ]
}
```

---

## Daily Entries

### POST /projects/:projectId/daily-entries/time
Save a time entry (labor).

**Auth Required:** Foreman, PA, Admin (role-based check)

**Request:**
```json
{
  "date_of_work": "2026-04-27",
  "employee_id": "uuid-emp-1",
  "cost_code_id": "CC-001",
  "regular_hours": 8.0,
  "overtime_hours": 2.0,
  "travel_hours": 0.5,
  "comments": "Site prep completion"
}
```

**Response (201):**
```json
{
  "time_entry_id": "uuid-te-1",
  "employee_name": "Mike Johnson",
  "cost_code_id": "CC-001",
  "position_name": "Foreman",
  "regular_hours": 8.0,
  "overtime_hours": 2.0,
  "travel_hours": 0.5,
  "regular_rate": 65.00,
  "overtime_rate": 97.50,
  "travel_rate": 32.50,
  "regular_cost": 520.00,
  "overtime_cost": 195.00,
  "travel_cost": 16.25,
  "total_cost": 731.25,
  "date_of_work": "2026-04-27",
  "entered_at": "2026-04-27T15:00:00Z"
}
```

**Error (400):**
```json
{
  "error": "Employee not found in project",
  "field": "employee_id"
}
```

**Error (400):**
```json
{
  "error": "Cost code not assigned to this project",
  "field": "cost_code_id"
}
```

### POST /projects/:projectId/daily-entries/equipment
Save an equipment usage entry.

**Auth Required:** Foreman, PA, Admin

**Request:**
```json
{
  "date_of_work": "2026-04-27",
  "equipment_id": "uuid-eq-1",
  "cost_code_id": "CC-002",
  "usage_type": "DAILY",
  "quantity": 1.0,
  "comments": "Excavator for site prep"
}
```

**Response (201):**
```json
{
  "equipment_entry_id": "uuid-ee-1",
  "equipment_name": "Excavator CAT 320",
  "usage_type": "DAILY",
  "quantity": 1.0,
  "rate": 400.00,
  "total_cost": 400.00,
  "cost_code_id": "CC-002",
  "date_of_work": "2026-04-27",
  "entered_at": "2026-04-27T15:00:00Z"
}
```

### POST /projects/:projectId/daily-entries/material
Save a material invoice line item.

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "invoice_date": "2026-04-27",
  "invoice_po_number": "PO-12459",
  "vendor": "Supplier A",
  "description": "500 feet of 14/2 Romex cable",
  "cost_code_id": "CC-003",
  "billing_line_id": "uuid-bl-3",
  "amount": 2450.00
}
```

**Response (201):**
```json
{
  "material_entry_id": "uuid-me-1",
  "invoice_date": "2026-04-27",
  "invoice_po_number": "PO-12459",
  "vendor": "Supplier A",
  "description": "500 feet of 14/2 Romex cable",
  "cost_code_id": "CC-003",
  "amount": 2450.00,
  "entered_at": "2026-04-27T15:00:00Z"
}
```

### GET /projects/:projectId/daily-entries
Get all daily entries for a project (with filtering).

**Query Parameters:**
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD
- `entry_type` (optional): 'time', 'equipment', 'material', 'all' (default: 'all')
- `cost_code_id` (optional): Filter by cost code
- `limit` (default 100): Pagination

**Response (200):**
```json
{
  "entries": [
    {
      "entry_id": "uuid-te-1",
      "entry_type": "TIME",
      "date_of_work": "2026-04-27",
      "employee_name": "Mike Johnson",
      "cost_code_id": "CC-001",
      "total_cost": 731.25,
      "entered_by": "John Doe"
    },
    {
      "entry_id": "uuid-ee-1",
      "entry_type": "EQUIPMENT",
      "date_of_work": "2026-04-27",
      "equipment_name": "Excavator CAT 320",
      "cost_code_id": "CC-002",
      "total_cost": 400.00,
      "entered_by": "John Doe"
    }
  ],
  "total": 47,
  "limit": 100,
  "offset": 0
}
```

---

## Activity Log

### POST /projects/:projectId/activity-log
Add a daily activity note.

**Auth Required:** Foreman, PM, PA, Admin

**Request:**
```json
{
  "date_of_activity": "2026-04-27",
  "activity_type": "WORK_PERFORMED",
  "notes": "Site layout and excavation marks completed. Mobilization package progressing on schedule. Crew of 2 (operator + laborer) spent 10 hours on rough grading and stake setup. No safety incidents. Ready to start Phase 1 rough-in on Monday."
}
```

**Response (201):**
```json
{
  "activity_id": "uuid-act-1",
  "date_of_activity": "2026-04-27",
  "activity_type": "WORK_PERFORMED",
  "notes": "Site layout...",
  "entered_by": "John Doe",
  "entered_at": "2026-04-27T15:30:00Z"
}
```

### GET /projects/:projectId/activity-log
Get activity log for a project.

**Query Parameters:**
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD
- `activity_type` (optional): 'WORK_PERFORMED', 'MATERIAL_ORDERED', 'MATERIAL_RECEIVED', 'OTHER'
- `limit` (default 50): Pagination

**Response (200):**
```json
{
  "activities": [
    {
      "activity_id": "uuid-act-1",
      "date_of_activity": "2026-04-27",
      "activity_type": "WORK_PERFORMED",
      "notes": "Site layout...",
      "entered_by": "John Doe",
      "entered_at": "2026-04-27T15:30:00Z"
    }
  ],
  "total": 23,
  "limit": 50,
  "offset": 0
}
```

---

## Budget & Dashboard Queries

### GET /projects/:projectId/budget/cost-codes
Get budget breakdown by cost code (three-tier view).

**Response (200):**
```json
{
  "cost_codes": [
    {
      "project_cost_code_id": "uuid-pcc-1",
      "cost_code_id": "CC-001",
      "description": "Labor - Field",
      "cost_type": "LABOUR",
      "execution_phase": "Phase 1 - Mobilization",
      "budget_allocated": 10000.00,
      "fiwp_hours": 200.0,
      "actual_hours": 152.0,
      "actual_cost": 7620.00,
      "remaining_budget": 2380.00,
      "percent_used": 76.2,
      "percent_of_fiwp": 76.0
    },
    {
      "project_cost_code_id": "uuid-pcc-2",
      "cost_code_id": "CC-002",
      "description": "Equipment - Excavator",
      "cost_type": "EQUIPMENT",
      "execution_phase": "Phase 1 - Mobilization",
      "budget_allocated": 5000.00,
      "fiwp_hours": 10.0,
      "actual_hours": 6.4,
      "actual_cost": 3200.00,
      "remaining_budget": 1800.00,
      "percent_used": 64.0,
      "percent_of_fiwp": 64.0
    }
  ],
  "total_budget": 45000.00,
  "total_actual": 34525.00,
  "total_remaining": 10475.00,
  "total_percent_used": 76.7
}
```

### GET /clients/:clientId/budget
Get budget rollup for all projects under a client.

**Response (200):**
```json
{
  "client_name": "ABC Energy",
  "projects": [
    {
      "project_id": "uuid-proj-1",
      "project_name": "F410 - Rosetown Site",
      "budget": 45000.00,
      "actual": 34525.00,
      "remaining": 10475.00,
      "percent_used": 76.7
    },
    {
      "project_id": "uuid-proj-2",
      "project_name": "F411 - Warman Expansion",
      "budget": 75000.00,
      "actual": 68200.00,
      "remaining": 6800.00,
      "percent_used": 90.9
    }
  ],
  "total_budget": 120000.00,
  "total_actual": 102725.00,
  "total_remaining": 17275.00,
  "total_percent_used": 85.6
}
```

### GET /divisions/:divisionId/budget
Get overall dashboard for a division (all projects).

**Query Parameters:**
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD (defaults to current month)

**Response (200):**
```json
{
  "division_name": "Industrial",
  "date_range": {
    "from": "2026-04-01",
    "to": "2026-04-27"
  },
  "metrics": {
    "total_budget": 185000.00,
    "total_actual": 127450.00,
    "total_remaining": 57550.00,
    "total_percent_used": 68.9,
    "project_count": 3,
    "active_projects": 3,
    "completed_projects": 0
  },
  "by_cost_type": {
    "LABOUR": {
      "budget": 80000.00,
      "actual": 65450.00,
      "remaining": 14550.00,
      "percent_used": 81.8
    },
    "EQUIPMENT": {
      "budget": 60000.00,
      "actual": 42000.00,
      "remaining": 18000.00,
      "percent_used": 70.0
    },
    "MATERIAL": {
      "budget": 45000.00,
      "actual": 20000.00,
      "remaining": 25000.00,
      "percent_used": 44.4
    }
  },
  "projects": [
    {
      "project_id": "uuid-proj-1",
      "project_name": "F410 - Rosetown Site",
      "budget": 45000.00,
      "actual": 34525.00,
      "remaining": 10475.00,
      "percent_used": 76.7
    }
  ]
}
```

### GET /projects/:projectId/daily-summary
Get daily summary for a specific date (total entries and cost for that day).

**Query Parameters:**
- `date`: YYYY-MM-DD (required)

**Response (200):**
```json
{
  "date": "2026-04-27",
  "project_name": "F410 - Rosetown Site",
  "entries": [
    {
      "cost_code_id": "CC-001",
      "description": "Labor - Field",
      "entry_count": 2,
      "total_cost": 731.25
    },
    {
      "cost_code_id": "CC-002",
      "description": "Equipment - Excavator",
      "entry_count": 1,
      "total_cost": 400.00
    },
    {
      "cost_code_id": "CC-003",
      "description": "Materials",
      "entry_count": 1,
      "total_cost": 2450.00
    }
  ],
  "daily_total": 3581.25,
  "month_to_date_total": 34525.00,
  "budget_status": [
    {
      "cost_code_id": "CC-001",
      "remaining_budget": 2380.00
    }
  ]
}
```

---

## Locking & Approval

### POST /projects/:projectId/lock
PM approves and locks the project (client approved).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "client_approval_date": "2026-04-27T14:30:00Z"
}
```

**Response (200):**
```json
{
  "project_id": "uuid-proj-1",
  "client_approval_locked": true,
  "client_approval_date": "2026-04-27T14:30:00Z"
}
```

### POST /projects/:projectId/entries/:entryId/correct
Correct a locked entry (with mandatory reason).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "entry_type": "TIME",
  "field_changed": "regular_hours",
  "new_value": "10",
  "reason": "Corrected timesheet - foreman confirmed 10 hours, not 8"
}
```

**Response (200):**
```json
{
  "entry_id": "uuid-te-1",
  "original_value": "8",
  "new_value": "10",
  "reason": "Corrected timesheet...",
  "changed_by": "Jane Smith",
  "changed_at": "2026-04-27T16:00:00Z",
  "audit_id": "uuid-audit-1"
}
```

---

## Exports

### POST /projects/:projectId/export/jonas
Export time and equipment entries to Jonas format (TAB-delimited TXT).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "date_from": "2026-04-01",
  "date_to": "2026-04-27",
  "include_entries": ["TIME", "EQUIPMENT"],
  "format": "tab_delimited"
}
```

**Response (200):**
Download file: `F410_Jonas_Export_2026-04-01_to_2026-04-27.txt`

File content (TAB-delimited):
```
KAMMU	04/27/2026	8	2		H04	0.5	26-0007	10100	L
KAMMU	04/27/2026	8	2			26-0007	10100	L
SARCHE	04/26/2026	8			26-0003	10100	L
```

**Error (400):**
```json
{
  "error": "No entries found for date range",
  "date_range": "2026-04-01 to 2026-04-27"
}
```

**Error (403):**
```json
{
  "error": "Project is not locked. Only locked projects can be exported."
}
```

### POST /projects/:projectId/export/pdf
Export daily LEM to PDF (matching your current LEM format).

**Auth Required:** PM, PA, Admin

**Request:**
```json
{
  "date_from": "2026-04-01",
  "date_to": "2026-04-27",
  "include_summary": true
}
```

**Response (200):**
Download file: `F410_Daily_LEM_2026-04-01_to_2026-04-27.pdf`

---

## Error Handling

All errors follow this format:

**4xx Errors:**
```json
{
  "error": "Human-readable error message",
  "status": 400,
  "field": "field_name (if validation error)",
  "timestamp": "2026-04-27T16:00:00Z"
}
```

**Common Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success, no response body
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid auth token
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Authentication Details

All endpoints (except `/auth/login`) require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Token is returned from login and contains:
- `user_id`
- `company_id`
- `assigned_divisions` (array of division IDs)
- `roles` (array of roles)

Backend validates token and checks role/division permissions on each request.

---

## Pagination

Paginated responses include:
- `total`: Total number of records
- `limit`: Records per page
- `offset`: Starting record number

Example:
```json
{
  "projects": [...],
  "total": 47,
  "limit": 50,
  "offset": 0
}
```

---

## Rate Limiting

No rate limiting in MVP. Add in Phase 2 if needed.

---

## Versioning

Base URL is `/api` (v1 implicit). Future versions can use `/api/v2`, `/api/v3`, etc.

---

## Summary

**Endpoint Categories:**
1. **Auth**: 1 endpoint (login)
2. **Employee Codes**: 4 endpoints (GET, POST, PUT, DELETE)
3. **Cost Types**: 2 endpoints (GET, POST)
4. **Position Rates**: 2 endpoints (GET, POST)
5. **Projects**: 9 endpoints (GET list, GET detail, POST, setup sub-endpoints)
6. **Daily Entries**: 6 endpoints (POST time, equipment, material; GET list; GET summary)
7. **Activity Log**: 2 endpoints (POST, GET)
8. **Budget/Dashboard**: 4 endpoints (by cost code, by client, by division, daily summary)
9. **Locking/Approval**: 2 endpoints (lock, correct)
10. **Exports**: 2 endpoints (Jonas, PDF)

**Total: 34 endpoints**

All endpoints documented with:
- HTTP method & path
- Authentication requirement & roles
- Request/response shapes (JSON)
- Error cases
- Status codes

Ready to code!
