# LEM Book App - Design Specification (Final)

## Overview

**Purpose:** Multi-tenant, multi-division daily operational system for labor, equipment, and material tracking with project-specific rate tables and real-time budget monitoring. MVP is a timesheet + budget app; Phase 3 goal is to consolidate F220/F240/F280/Register into one live system (replacing spreadsheets).

**Phase 1 (MVP) Goals:**
- Multi-division, multi-client, multi-project architecture (Company → Divisions → Clients → Projects)
- Foreman enters daily time (full date: YYYY-MM-DD, cost code, employee, hours by rate type)
- Equipment and material invoice tracking (separate sections)
- Activity Log (narrative daily notes: work performed, material ordered/received)
- Three-tier budget view (Budget | FIWP Hours | Actual) with variance
- FIWP status visibility (read-only reference from F240/Register)
- Real-time budget vs. actual tracking by cost code and execution phase
- Three dashboard levels: Overall (all projects), Client (projects for one client), Project (cost code detail)
- Client approval checkbox → locks daily LEM
- Export to Jonas CSV (labor + equipment, date range + project selection)
- Export to PDF (daily LEM format)
- Flexible role-based permissions (company default, customizable per project)

**Phase 3 Vision (Future):**
- Consolidate F220 (Execution Plan), F240 (FIWP Templates), F280 (3-Week Lookahead), and Register (status tracking) into the app
- Single source of truth: work is planned in app, authorized with FIWP, tracked with daily time/materials, monitored with status updates
- Eliminate spreadsheet-based project management
- Real-time variance reporting (planned vs actual at FIWP and phase level)
- Resource capacity planning (crew availability vs committed hours)

---

## System Architecture

```
Company
├── Divisions (e.g., Industrial, Oil & Gas, Service)
│   ├── Users assigned to divisions
│   ├── Role Defaults (created once, copied to all projects in division)
│   └── Clients (assigned to division)
│       └── Projects (assigned to client)
│           ├── Cost Codes (mapped to billing lines)
│           ├── Employees (copied from other projects, adjustable)
│           ├── Labor Rate Table (Regular, OT, Travel — copied or created)
│           ├── Equipment List (copied from other projects, same rates)
│           └── Daily Entries (date → cost code → employee → hours)
```

**Navigation Flow:**
1. User logs in → sees their assigned divisions
2. Select division → sees all clients in that division
3. Select client → sees all projects for that client
4. Select project → enters daily time/equipment/material
5. Or: Select project directly from "All Projects" list (grouped by client, filtered by division)

---

## Company Setup (One-Time, by Admin)

### 1. Create Divisions
Define divisions that exist within company:
- Industrial
- Oil & Gas / Service
- (Custom divisions as needed)

### 2. Create Default Role Matrix
Define what each role can do by default (applied to all new projects in this company):

| Role | Enter Time | Enter Material | Edit Rates | View Budget | Can Lock | Can Approve | Can Export |
|------|-----------|-----------------|-----------|-------------|---------|------------|-----------|
| Foreman | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Worker | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PM | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Coordinator | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Project Administrator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Controls | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Division Manager | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

*PM can customize per project after creation*

### 3. Assign Users to Divisions & Roles
Admin assigns:
- User → Division(s) (what they can see)
- User → Role (what they can do)
- Example: John = Division Manager in "Industrial" + PM in "Oil & Gas"

---

## Client Setup

Admin or PM creates clients:
- **Client Name**
- **Division** (which division this client belongs to)
- **Primary Contact** (name, email, phone)

Clients can have multiple projects across multiple divisions (if applicable).

---

## Project Setup & Configuration

When PM creates a new project:

### 1. Basic Info
- **Client** (dropdown, filtered by division)
- **Division** (auto-selected based on client assignment)
- **Project Name**
- **PO Number**
- **PO Value** ("Not to Exceed" amount)
- **Budget Type:**
  - **PROJECT:** Fixed budget allocated to each cost code
  - **SERVICE:** Single PO value, cost codes draw from it
- **Start Date** (YYYY-MM-DD)
- **End Date** (YYYY-MM-DD)
- **Primary Contacts** (PM, Foreman, Finance contact, etc.)

### 2. Billing Lines (1-12)
Define billing lines for this project:
- Line 1: Site Services
- Line 2: Equipment Rental
- Line 3: Materials
- (etc.)

### 3. Cost Codes & Budget
PM adds cost codes to project:
- **Cost Code** (from master list, e.g., "CC-001")
- **Description** (e.g., "Labor - Field")
- **Cost Type** (LABOUR, EQUIPMENT, MATERIAL, FREIGHT)
- **Billing Line** (which line does this belong to)
- **Budget Allocated** (if PROJECT mode; if SERVICE mode, this is optional/informational)

Example:
| Cost Code | Description | Type | Billing Line | Budget |
|-----------|-------------|------|--------------|--------|
| CC-001 | Labor - Field | LABOUR | Line 1 | $10,000 |
| CC-002 | Excavator Rental | EQUIPMENT | Line 2 | $5,000 |
| CC-003 | Steel Materials | MATERIAL | Line 3 | $15,000 |

### 4. Labor Rate Table

**Option A: Create from Scratch**
- Regular: $/hour
- Overtime: $/hour
- Travel Time: $/hour

**Option B: Copy from Existing Project (Recommended)**
1. Select source project
2. System copies: Regular, OT, Travel rates
3. PM can adjust rates immediately or later
4. Option to save as "template" for future projects

### 5. Employees List

**Option A: Create from Scratch**
- Add employees individually

**Option B: Copy from Existing Project (Recommended)**
1. Select source project
2. System copies all employees
3. PM can add/remove employees after copy
4. Employee rates (if hourly) pull from labor rate table

### 6. Equipment List

**Copy from Existing Project**
1. Select source project
2. System copies all equipment with same daily/weekly/monthly rates
3. Rates are locked (not adjusted during copy)
4. Can add new equipment after copy

### 7. Role Permissions
System applies **company default role matrix** to this project.  
PM can customize roles for this project if needed (e.g., allow certain workers to enter time).

### 8. Client Approval Lock
PM configures:
- **Manual Lock:** PM clicks "Client Approved" checkbox (with timestamp) → locks daily LEM
- Daily entries remain editable until PM checks this box
- Once locked, only corrections allowed (with reason, tracked in audit trail)

---

## Data Model

### Core Tables

**Projects**
- project_id (UUID)
- client_id (UUID)
- division_id (UUID)
- project_name
- po_number
- po_value (decimal)
- budget_type (enum: PROJECT / SERVICE)
- start_date (date: YYYY-MM-DD)
- end_date (date: YYYY-MM-DD)
- created_at, updated_at

**Cost Codes (Project-Specific)**
- project_cc_id (UUID)
- project_id (UUID)
- cost_code_id (string, e.g., "CC-001")
- description
- cost_type (enum: LABOUR / EQUIPMENT / MATERIAL / FREIGHT)
- billing_line_id (UUID)
- budget_allocated (decimal, optional for SERVICE mode)

**Labor Rate Table (Project-Specific)**
- rate_id (UUID)
- project_id (UUID)
- regular_rate (decimal, $/hour)
- overtime_rate (decimal, $/hour)
- travel_time_rate (decimal, $/hour)
- last_updated, updated_by

**Employees (Project-Specific)**
- employee_id (UUID)
- project_id (UUID)
- employee_name
- role (e.g., "Operator", "Laborer")
- (rates pulled from labor rate table)

**Equipment (Project-Specific)**
- equipment_id (UUID)
- project_id (UUID)
- equipment_name
- daily_rate (decimal)
- weekly_rate (decimal)
- monthly_rate (decimal)
- cost_code_id (string, which CC to charge to)

**Daily Time Entries**
- time_entry_id (UUID)
- project_id (UUID)
- date_of_work (date: YYYY-MM-DD)
- cost_code_id (string)
- employee_id (UUID)
- regular_hours (decimal)
- overtime_hours (decimal)
- travel_hours (decimal)
- regular_cost (auto-calculated: regular_hours × rate)
- overtime_cost (auto-calculated: overtime_hours × rate)
- travel_cost (auto-calculated: travel_hours × rate)
- total_cost (auto-calculated: sum)
- comments (text, optional)
- entered_by (user_id)
- entered_at (timestamp)
- is_locked (boolean, once client approved)

**Equipment Usage Entries**
- equipment_entry_id (UUID)
- project_id (UUID)
- date_of_work (date: YYYY-MM-DD)
- equipment_id (UUID)
- cost_code_id (string)
- usage_type (enum: DAILY / WEEKLY / MONTHLY)
- quantity (decimal)
- rate (decimal, auto-pulled from equipment list)
- total_cost (auto-calculated: quantity × rate)
- comments (text, optional)
- entered_by (user_id)
- entered_at (timestamp)
- is_locked (boolean)

**Material Invoice Line Items**
- material_entry_id (UUID)
- project_id (UUID)
- invoice_date (date: YYYY-MM-DD)
- invoice_po_number (string)
- vendor (string)
- description (text)
- cost_code_id (string)
- billing_line_id (UUID)
- amount (decimal)
- entered_by (user_id)
- entered_at (timestamp)
- is_locked (boolean)

**Audit Trail**
- audit_id (UUID)
- entry_type (enum: TIME / EQUIPMENT / MATERIAL)
- entry_id (UUID)
- changed_by (user_id)
- changed_at (timestamp)
- field_changed (string)
- original_value, new_value (strings)
- reason (text, required if locked)

---

## Daily Entry Workflow

### Step 1: Foreman/PM Navigates to Project

1. Open app
2. Optionally filter by division (auto-applied if user is in only one division)
3. See all projects (grouped by client) or search by project name
4. Click on project → goes to project dashboard

### Step 2: Select Date & Enter Labor Time

1. Click "Add Entry for Date"
2. **Pick full date** (YYYY-MM-DD calendar picker)
3. Click "Add Time Entry"
4. **Select cost code** (dropdown, only active codes for this project)
5. **Select employee** (dropdown, from project employee list)
6. **Enter hours:**
   - Regular hours
   - Overtime hours
   - Travel time hours
7. System auto-calculates costs:
   - Regular hours × regular rate = Regular cost
   - OT hours × OT rate = OT cost
   - Travel hours × travel rate = Travel cost
   - **Total = sum**
8. (Optional) Add comments
9. **Save entry**

**Validation:**
- Hours must be positive
- Cost code must be active for project
- Rates must exist
- Date must be within project date range

### Step 3: (Optional) Add Equipment Usage

1. Click "Add Equipment Entry" (if role permits)
2. **Select equipment** (dropdown)
3. **Select usage type** (DAILY / WEEKLY / MONTHLY)
4. **Enter quantity** (1, 1.5, etc.)
5. System auto-pulls rate and calculates: quantity × rate
6. Save entry

### Step 4: (Optional) Add Material Invoice

1. Click "Add Material" (if role permits)
2. Enter:
   - Invoice/PO #
   - Vendor
   - Invoice date (YYYY-MM-DD)
   - Description (line item)
   - Amount ($)
   - Cost code
   - Billing line
3. Save entry

### Step 5: Daily Summary

Foreman sees:
- All entries for today (grouped by cost code)
- Running total for the day
- Budget status:
  - **PROJECT mode:** Remaining budget per cost code
  - **SERVICE mode:** Remaining from total PO
- Any budget overruns flagged

**Save entries for the day** → all entries recorded, editable until PM locks

---

## Dashboard Levels

### 1. Project Dashboard (PM, Foreman, All Roles)

**Shows:**
- Project name, dates, budget, PO
- **Cost Code Breakdown** (table with Budget | Actual to-Date | Remaining | % Used)
- **Daily entries** (list grouped by date and cost code)
- **Summary metrics** (total incurred, remaining, % used)
- **Client Approved checkbox** (with timestamp) → locks all entries for this date/period

**Actions:**
- Click cost code → drill into all entries for that code
- Click date → edit entries for that date
- Add time/equipment/material entries
- Export to PDF
- **Lock for client** (if client approved)

### 2. Client Dashboard (PM, Division Manager, Finance)

**Shows:**
- Client name
- All projects for this client (list or cards)
- For each project:
  - Project name, budget, actual, remaining
  - Quick budget status (% used, color-coded)
- **Client rollup:**
  - Total budget across all projects
  - Total actual to-date
  - Total remaining

**Actions:**
- Click project → go to project dashboard
- Compare budget across projects
- Export all project data for client

### 3. Overall Dashboard (Division Manager, Finance, Project Controls)

**Shows:**
- **Filter by division** (user's assigned divisions)
- **Rollup across all clients & projects** in selected divisions
- Key metrics:
  - Total budget across all
  - Total actual to-date
  - Total remaining
  - Budget utilization %
- **Charts:**
  - Budget vs actual trend
  - Cost breakdown by cost type (Labour, Equipment, Material, Freight)
  - Cost breakdown by division
- **Projects list** (all projects, color-coded by budget status)

**Actions:**
- Filter by division, date range, cost type
- Drill down: Click project → client dashboard → project dashboard
- Export summary report

---

## Approval & Locking (Simple Model)

**Current Model (Recommended):**

1. **Foreman/PM enters data** → editable at any time until locked
2. **PM clicks "Client Approved"** (checkbox with timestamp) → locks all entries
3. **Once locked:**
   - No one can edit (except PM for corrections)
   - If PM discovers error, she edits with mandatory reason
   - Audit trail captures: before/after, reason, who, when

**Future Enhancement:**
- Multi-step approval (Foreman → PM → Finance)
- Spot-check approval (PM randomly approves daily batches)

---

## Activity Log (Daily Notes)

**Purpose:** Foreman/PM narrative record of daily project activities, separate from time/equipment/material entries.

**What gets logged:**
- **Work Performed** — Summary of work completed that day (e.g., "Branch wiring completed on L2 East, 8 hrs crew, no issues")
- **Material Ordered** — New purchase orders or requests (e.g., "Ordered 500 feet of 14/2 Romex from supplier X, PO #12345")
- **Material Received** — Deliveries and receipt status (e.g., "Received 500 feet 14/2 Romex, on site, inspected OK")
- **Issues/Constraints** — Any blockers, rework, schedule impacts (e.g., "GC ceiling closure delayed, pushed branch wiring to next week")
- **FIWP Status Changes** — Notes if FIWP was blocked, carried over, or completed (future, but logged in notes now)

**Entry Method:**
- Free-text narrative (one entry per day, per project)
- Entered by Foreman or PM
- Timestamp auto-recorded
- Optional attachment (photos, sketches, supplier emails)

**Integration (Future):**
- Link to F240 Materials sheet (confirm materials are on site for readiness)
- Link to FIWP status changes
- Feed into daily standup summary

---

## Three-Tier Budget View

**Level 1: Budget**
- Total allocated to the project (from LEM setup, sourced from PO or cost code allocation)
- Set during project configuration
- Per cost code (PROJECT mode) OR total PO (SERVICE mode)

**Level 2: FIWP Hours**
- Planned labor hours from F240 FIWP estimated hours
- Populated during project setup (from F240, manual entry, or future: imported from Register)
- Shows what *should* take based on the execution plan
- Per FIWP activity (rolled up to cost code)

**Level 3: Actual**
- Actual hours entered daily in LEM
- Accumulated as Foreman/PM enters time
- Per cost code
- Synced to Jonas (for PM/PC to update Estimated Hours sheet in F280)

**Dashboard Display (per cost code or FIWP activity):**

| Cost Code / FIWP | Budget | FIWP Hours | Actual | Variance (Actual - Budget) | % Complete (Actual / FIWP) |
|------------------|--------|-----------|--------|---------------------------|-----------------------------|
| CC-001 Labor-Field | $10,000 | 200 hrs | 120 hrs | -$X / -80 hrs | 60% |
| IMP-E-022 Branch Wiring | $5,000 | 80 hrs | 65 hrs | -$X / -15 hrs | 81% |

**Variance interpretation:**
- **Budget vs Actual:** Shows financial variance (favorable/unfavorable)
- **FIWP vs Actual:** Shows schedule/productivity variance (ahead/behind plan)
- **% Complete:** Progress toward FIWP estimated completion

**Future:** When F240/Register brought into app, FIWP Hours will auto-populate and update as FIWP scope changes.

---

## FIWP Integration (MVP & Future)

### MVP (Phase 1 — Read-Only Reference)

**FIWP Status visible to Foreman:**
- When Foreman opens project, sidebar shows:
  - Phase name
  - List of FIWPs for that phase with status badges (color-coded)
  - Status legend: READY (green) | IN PROGRESS (blue) | PENDING (amber) | BLOCKED (red) | COMPLETE (gray)
- Foreman can see which FIWPs are actively planned (READY) vs blocked/pending
- Status updated externally (from Register, not in LEM yet)

**Cost Code → FIWP Mapping (Optional):**
- During project setup, PM can configure: Cost Code maps to FIWP ID(s)
- Example: CC-001 (Labor-Field) → IMP-E-001, IMP-E-015, IMP-E-022 (three separate FIWPs)
- When entered in MVP, this is informational (appears in time entry labels)
- Not required to start; PM can leave blank and add later

**Data fields (in database, not visible in MVP):**
- cost_code_fiwp_mapping table
- fiwp_status (enum: PRE_PLANNED, PENDING, READY, IN_PROGRESS, BLOCKED, CARRIED_OVER, COMPLETE)
- fiwp_planned_hours (from F240)
- fiwp_id (link to future Register)

### Phase 2 — Editable Status & Mapping

**Super/Foreman/PC can update FIWP Status in app:**
- Click FIWP status badge → dropdown to change status
- Mandatory notes required for status change (why it moved from PENDING → READY, or READY → BLOCKED, etc.)
- Timestamp recorded
- Change synced back to Register (future, or logged in app for now)

**Cost Code → FIWP Mapping becomes required:**
- PM must map cost codes to FIWPs at setup
- System enforces: hours entered against CC must match total FIWP estimated hours
- Variance tracking automatic

### Phase 3 — Register Brought Into App

**When F240/Register become live in app:**
- FIWP data sourced directly from Register (no manual entry needed)
- Status updates in Register are real-time in LEM
- Readiness checklist (10 items) visible in LEM
- Lead Hand assigned in LEM (pulled from Register)
- Planned vs Actual hours comparison automatic

---

## Corrections & Audit Trail

**If error found after lock:**

1. PM clicks "Edit" on locked entry
2. System prompts:
   - Which field to change?
   - New value
   - **Reason for change** (required)
3. System captures:
   - Original value
   - New value
   - Who changed it, when
   - Reason

**Audit trail visible to:** PM, Project Coordinator, Project Administrator (role-based)

---

## Copy Rates & Employees Workflow

**During project setup:**

### Copy Labor Rates
1. "Copy from existing project" option
2. Select source project
3. System copies: Regular, OT, Travel rates
4. PM reviews and can adjust any rate immediately
5. Saved as project-specific rates
6. (Optional) PM can save as company template for future projects

### Copy Employees
1. "Copy from existing project" option
2. Select source project
3. System copies all employees
4. PM can add/remove employees after copy
5. Employee names/roles copied as-is
6. Rates auto-pulled from labor rate table

### Copy Equipment
1. "Copy from existing project" option
2. Select source project
3. System copies all equipment with exact daily/weekly/monthly rates
4. Rates locked (not adjustable during copy)
5. PM can add new equipment after copy

---

## Export to PDF

**When PM clicks "Export to PDF":**

1. System generates document matching your daily LEM format
2. Includes:
   - Project header (name, dates, PO, contact)
   - Billing line summary (by cost code or date)
   - Cost code breakdown (budget, actual, remaining)
   - Summary section (total incurred, remaining, % used)
   - Correction log (if any edits made)

3. PM downloads and sends to client for approval

---

## Role Configuration (Per Project)

**Company Default (applied to all projects):**

| Role | Enter Time | Enter Material | Edit Rates | View Budget | Can Lock | Can Approve |
|------|-----------|-----------------|-----------|-------------|---------|------------|
| Foreman | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Worker | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PM | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Coordinator | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Project Administrator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Controls | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Division Manager | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**PM can customize per project** (e.g., allow certain workers to enter time, allow coordinator to lock).

---

## Future-Proofing for F220/F240/F280/Register Integration

**The LEM database is designed NOW to support Phase 3 consolidation** — so that when you bring F220/F240/F280/Register into the app, no major rework is needed.

**Data tables added to support Phase 3 (but not used in MVP):**

**Execution Plan (F220) Tables:**
- execution_phases (id, project_id, phase_name, phase_number, predecessor_phase, planned_start, planned_finish, budget_hours, cost_code_id)
- sequencing_rules (id, project_id, rule_text, enforced_by)
- work_areas (id, project_id, area_name, execution_order, constraints)

**FIWP Register Tables:**
- fiwp_register (id, project_id, fiwp_id, scope_description, phase_id, work_area_id, status, % complete, lead_hand_id, estimated_hours, actual_hours, readiness_checklist_10_items, predecessor_fiwp, carryover_cause_code)
- readiness_checklist_template (id, item_description, mandatory_yes_no)

**3-Week Lookahead (F280) Support:**
- f280_task_row (id, project_id, fiwp_id, schedule_row_number, hours_remaining, daily_marks_array)

**Why this matters:**
- Time entries, equipment, and material entries link to FIWP (via cost_code_fiwp_mapping)
- Daily actuals automatically calculate Hours Remaining = Estimated - Actual
- Status updates (when available) flow from Register into LEM without re-entry
- Variance dashboards built from unified data, not manual reconciliation

**MVP Data Model:**
In Phase 1, these tables exist in the database but are **empty/unpopulated**. PM doesn't interact with them. As Phase 3 approaches, data gets populated (from spreadsheets initially, then natively in app).

**No MVP changes needed:**
- All existing LEM functionality works exactly as designed
- Phase 3 data structures are there, invisible to users until activated

- ✅ Multi-division, multi-client, multi-project architecture
- ✅ Foreman enters daily time (full date, cost code, employee, hours by rate type)
- ✅ Automatic rate calculation (hours × project-specific rates)
- ✅ Equipment & material tracked separately
- ✅ Copy labor rates & employees between projects (with adjust), equipment same
- ✅ Budget vs actual dashboard per cost code
- ✅ Three dashboard levels (Overall, Client, Project)
- ✅ Client approval checkbox → locks daily LEM
- ✅ Corrections tracked in audit trail
- ✅ Company default role matrix, customizable per project
- ✅ Single source of truth for Jonas reconciliation

---

---

## Success Criteria

**MVP (Phase 1):**
- ✅ Multi-division, multi-client, multi-project architecture (Company → Divisions → Clients → Projects)
- ✅ Foreman enters daily time (full date YYYY-MM-DD, cost code, employee, hours by rate type)
- ✅ Automatic rate calculation (hours × project-specific rates)
- ✅ Equipment usage tracked separately with auto-rate calculation
- ✅ Material invoice line items (PO, vendor, date, description, amount, cost code)
- ✅ Activity Log (narrative daily notes: work performed, material ordered, material received)
- ✅ **Three-tier budget view:** Budget | FIWP Hours | Actual with variance calculation
- ✅ Copy labor rates & employees between projects (with adjust), equipment same
- ✅ **Execution phase visibility** (cost code breakdown by F220 phase)
- ✅ **FIWP status visibility** (read-only: PRE-PLANNED, PENDING, READY, IN PROGRESS, BLOCKED, CARRIED OVER, COMPLETE)
- ✅ Three dashboard levels (Overall, Client, Project)
- ✅ Client approval checkbox → locks daily LEM
- ✅ Corrections tracked in audit trail
- ✅ Company default role matrix, customizable per project
- ✅ Export to Jonas CSV (date range + project selection)
- ✅ Export to PDF (daily LEM format)
- ✅ Single source of truth for Jonas reconciliation
- ✅ **Infrastructure in place** (but optional) for future Cost Code → FIWP mapping

**Phase 2+ Features:**
- ✅ FIWP status editable by Super/Foreman/PC
- ✅ Cost Code → FIWP mapping (required configuration)
- ✅ Audit trail visibility (edits/corrections with reason)
- ✅ Variance analysis by FIWP activity & phase
- ✅ Planned vs Actual hours comparison
- ✅ Resource utilization dashboard
- ✅ Activity Log structured fields
- ✅ **Phase 3:** Consolidate F220/F240/F280/Register into app (eliminate spreadsheets)

---

## Implementation Phases

**Phase 1 (MVP — LEM Launch):**
- Multi-division/client/project setup
- Daily time entry (full date YYYY-MM-DD, cost code, employee, hours by rate type)
- Equipment usage tracking
- Material invoice line items
- Activity Log (narrative daily notes: work performed, material ordered, material received)
- **Three-tier budget view:** Budget (from LEM setup) | FIWP Hours (from F240, manual or imported) | Actual (from daily entries)
- **Variance calculation:** Actual vs Budget, Actual vs FIWP Hours, % Complete
- Cost code breakdown by execution phase (from F220)
- **FIWP status visibility** (read-only: PRE-PLANNED, PENDING, READY, IN PROGRESS, BLOCKED, CARRIED OVER, COMPLETE)
- Rate table & employee management (copy between projects, adjust)
- Equipment list (copy between projects, same rates)
- Role permissions (company defaults, customizable per project)
- Client approval checkbox → locks daily LEM
- Export to CSV (Jonas format, date range + project selection)
- Export to PDF (daily LEM format)
- Three dashboards (Overall, Client, Project)
- **Infrastructure in place** (not enforced in MVP):
  - Cost Code → FIWP mapping fields
  - FIWP status update capability (but not required in MVP)

**Phase 2 (Polish & Integration):**
- Cost Code → FIWP mapping (optional configuration per project)
- **FIWP status editable** in app (Super/Foreman/PC can update status)
- Audit trail visibility (edits/corrections with reason)
- Advanced reporting & trends (variance analysis by cost code, by FIWP, by phase)
- Correction tracking (before/after, reason, who, when)
- Activity Log structured fields (work type, material status, notes)
- Approval workflow toggle (optional spot-check approval)
- Planned vs Actual hours by FIWP activity
- Resource utilization dashboard (available hours vs used by crew)

**Phase 3 (Future — Consolidate into App):**
- **Bring F220 into app** (Execution Plan: phases, activities, sequencing rules, work area table)
- **Bring F240 into app** (FIWP Templates: scope, tasks, readiness checklist, materials)
- **Bring F280 into app** (3-Week Lookahead: schedule, daily x-marks, manpower loading)
- **Bring Register into app** (status tracking, PPC reporting, carryover analysis)
- Integrate all four tools (F220 → F240 → Register → F280 live connections)
- Mobile app for field entry & status updates
- Jonas API integration (real-time actual hours sync)
- Integration with Jira/Monday for corrections & change orders
