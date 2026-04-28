# Backend Services Layer - Complete

All 6 core services have been created with full business logic. Ready for route integration.

---

## Services Overview

### 1. **authService.ts** (Authentication)
- `getUserByEmail()` — Fetch user by email
- `getUserById()` — Fetch user by ID
- `getUserDivisions()` — Get divisions user is assigned to
- `validateLogin()` — Validate credentials, return JWT token
- `createUser()` — Create new user account
- `assignUserToDivision()` — Assign user to division
- `updateUser()` — Update user details
- `verifySession()` — Verify token is still valid

**Key Logic:**
- Login returns JWT token + auth payload (user_id, company_id, email, divisions, roles)
- Password stored plain text (MVP - upgrade to bcrypt in production)
- Roles assigned based on email pattern (upgrade to database in Phase 2)

---

### 2. **projectService.ts** (Project Management)
- `getProjects()` — List projects (filtered by user's divisions)
- `getProjectById()` — Get full project config (cost codes, employees, rates, equipment)
- `createProject()` — Create new project
- `addBillingLines()` — Add 1-12 billing lines to project
- `addCostCodes()` — Add cost codes with budget allocation
- `assignEmployeesToProject()` — Assign employees from company master list
- `addEquipment()` — Add equipment with daily/weekly/monthly rates
- `copyPositionRates()` — Copy rates from another project (with optional adjustment)
- `copyEquipment()` — Copy equipment from another project (same rates)
- `lockProject()` — Lock project (client approval)
- `unlockProject()` — Unlock project

**Key Logic:**
- Cost codes map to billing lines and Jonas cost types (L, E, M, F)
- Rates can be project-specific or fall back to company-level
- Copy functions enable fast setup of similar projects
- Lock prevents entry edits (except via audit trail)

---

### 3. **entryService.ts** (Daily Entries)
- `saveTimeEntry()` — Save labor entry (auto-pulls rates, calculates costs)
- `saveEquipmentEntry()` — Save equipment usage (day/week/month)
- `saveMaterialEntry()` — Save material invoice line item
- `getEntries()` — Get all entries with filtering (by date, type, cost code)
- `getDailySummary()` — Get daily totals by cost code

**Key Logic:**
- Time entry: Employee → Position → auto-pull rates from project or company
- Auto-calculation: hours × rate = cost
- Equipment: quantity × rate = cost (rate based on usage type)
- Material: fixed amount
- Rates are snapshots (never retroactively changed)
- Daily summary aggregates all entry types by cost code

---

### 4. **budgetService.ts** (Budget & Dashboard)
- `getBudgetBreakdown()` — Three-tier budget per cost code (Budget | FIWP Hours | Actual)
- `getClientBudget()` — Budget rollup for all projects under a client
- `getDivisionDashboard()` — Overall dashboard with metrics by cost type and project

**Key Logic:**
- **Budget Tier 1:** Allocated budget (from project cost code setup)
- **Budget Tier 2:** FIWP Hours (planned hours from FIWP register, currently manual)
- **Budget Tier 3:** Actual (sum of all time, equipment, material entries)
- Variance calculations: Actual vs Budget, Actual vs FIWP Hours
- Percent used: (Actual / Budget) × 100
- Dashboard rolls up by cost type (Labour, Equipment, Material, Freight)

---

### 5. **activityLogService.ts** (Activity Logging)
- `addActivityLog()` — Add daily activity note (work performed, material ordered, etc.)
- `getActivityLog()` — Get activity entries with pagination and filters
- `getActivityLogByDate()` — Get activities for specific date
- `updateActivityLog()` — Update entry (date, type, notes)
- `deleteActivityLog()` — Delete entry
- `getActivitySummary()` — Get count of entries by type for date range

**Key Logic:**
- Free-text narrative notes (up to 5,000 characters)
- Four activity types: WORK_PERFORMED, MATERIAL_ORDERED, MATERIAL_RECEIVED, OTHER
- Timestamps tracked (entered_at, created_at, updated_at)
- Filters: date range, activity type
- Summary: breakdown by type within date range

---

### 6. **exportService.ts** (Export Generation)
- `exportToJonasCSV()` — Export to Jonas format (TAB-delimited, H01/H02/H04 logic)
- `exportToDailyLEMCSV()` — Export daily LEM report (human-readable CSV)

**Key Logic:**

**Jonas Format:**
- Regular + OT hours on same line (columns C & D)
- Travel (H04) on separate line (column F = "H04", column G = hours)
- Equipment entries separate section
- Format: Employee Code | Date (MM/DD/YYYY) | Reg Hrs | OT Hrs | ... | Job # | Dept | Cost Type

**Daily LEM Format:**
- Human-readable CSV with three sections: LABOR, EQUIPMENT, MATERIAL
- Columns: Date, Employee, Position, Cost Code, Hours/Qty, Rate, Cost
- One row per entry with total cost

---

## Function Count by Service

| Service | Functions | Purpose |
|---------|-----------|---------|
| authService | 8 | User login, auth, permissions |
| projectService | 11 | Project CRUD, setup, copy |
| entryService | 5 | Daily entry creation, retrieval |
| budgetService | 3 | Three-tier budget, dashboards |
| activityLogService | 6 | Activity notes CRUD |
| exportService | 2 | Jonas CSV, daily LEM export |
| **TOTAL** | **35 functions** | **Full business logic** |

---

## Architecture Flow

```
API Routes
    ↓
Service Layer (35 functions)
    ├── authService (authentication)
    ├── projectService (project management)
    ├── entryService (daily entries)
    ├── budgetService (calculations)
    ├── activityLogService (notes)
    └── exportService (exports)
    ↓
Database Layer (26 tables)
    ↓
PostgreSQL
```

---

## What's Ready to Build

✅ **All business logic complete** (budgets, entries, projects, auth, exports)  
✅ **Error handling throughout** (custom AppError class)  
✅ **Database queries optimized** (indexes on frequently queried columns)  
✅ **Type-safe** (all functions have TypeScript signatures)  
✅ **Ready for routes** (each service can be called from API endpoints)  

---

## Next Steps

**Option 1: Create API Routes** (use these services)
- `src/routes/auth.ts` — POST /auth/login
- `src/routes/projects.ts` — Project endpoints
- `src/routes/entries.ts` — Daily entry endpoints
- `src/routes/dashboards.ts` — Budget & dashboard endpoints
- `src/routes/activityLog.ts` — Activity log endpoints
- `src/routes/export.ts` — Export endpoints

**Option 2: Frontend Scaffolding** (React structure)
- Component hierarchy
- API client setup
- Pages and screens

Which would you like to build next?
