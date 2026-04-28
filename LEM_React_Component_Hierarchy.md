# LEM App React Component Hierarchy

## Overview

This document defines the React component structure for the LEM app, including folder organization, component hierarchy, state management, props contracts, and data flow.

**Tech Stack:**
- React 18+ with TypeScript
- React Router v6 for navigation
- Context API for global state (auth, user, selected division)
- Local state (useState) for component-level data
- Fetch/axios for API calls
- Tailwind CSS for styling (optional, or CSS modules)

---

## Folder Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── LogoutButton.tsx
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── DivisionSelector.tsx
│   ├── projects/
│   │   ├── ProjectDashboard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetailView.tsx
│   │   ├── BudgetBreakdown.tsx
│   │   └── BudgetTierCard.tsx
│   ├── setup/
│   │   ├── ProjectSetupWizard.tsx
│   │   ├── SetupStep1_BasicInfo.tsx
│   │   ├── SetupStep2_BillingLines.tsx
│   │   ├── SetupStep3_CostCodes.tsx
│   │   ├── SetupStep4_Rates.tsx
│   │   ├── SetupStep5_Review.tsx
│   │   ├── CopyRatesModal.tsx
│   │   └── CopyEquipmentModal.tsx
│   ├── daily-entry/
│   │   ├── DailyEntryScreen.tsx
│   │   ├── DateSelector.tsx
│   │   ├── TimeEntryForm.tsx
│   │   ├── EquipmentEntryForm.tsx
│   │   ├── MaterialEntryForm.tsx
│   │   ├── DailySummary.tsx
│   │   ├── ActivityLogSection.tsx
│   │   └── EntryList.tsx
│   ├── dashboards/
│   │   ├── OverallDashboard.tsx
│   │   ├── ClientDashboard.tsx
│   │   ├── ProjectDashboard.tsx
│   │   ├── BudgetMetricsCard.tsx
│   │   ├── CostTypeBreakdown.tsx
│   │   └── DashboardFilters.tsx
│   ├── activity-log/
│   │   ├── ActivityLogView.tsx
│   │   ├── ActivityLogEntry.tsx
│   │   ├── AddActivityModal.tsx
│   │   └── ActivityLogFilter.tsx
│   ├── admin/
│   │   ├── EmployeeManager.tsx
│   │   ├── EmployeeTable.tsx
│   │   ├── AddEmployeeModal.tsx
│   │   ├── PositionRatesManager.tsx
│   │   ├── PositionRateTable.tsx
│   │   ├── CostTypeManager.tsx
│   │   └── CostTypeTable.tsx
│   ├── shared/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── FormInput.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Alert.tsx
│   │   └── ProgressBar.tsx
│   └── export/
│       ├── ExportModal.tsx
│       ├── ExportFormatSelector.tsx
│       └── ExportStatus.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── ProjectSetupPage.tsx
│   ├── DailyEntryPage.tsx
│   ├── ActivityLogPage.tsx
│   ├── AdminPage.tsx
│   └── NotFoundPage.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── AuthProvider.tsx
│   └── useAuth.ts
├── hooks/
│   ├── useAPI.ts
│   ├── usePagination.ts
│   ├── useLocalStorage.ts
│   ├── useForm.ts
│   └── useDebounce.ts
├── services/
│   ├── api.ts (Axios instance)
│   ├── authService.ts
│   ├── projectService.ts
│   ├── entryService.ts
│   ├── dashboardService.ts
│   ├── exportService.ts
│   └── employeeService.ts
├── types/
│   ├── index.ts (All TypeScript types)
│   ├── project.ts
│   ├── entry.ts
│   ├── user.ts
│   ├── budget.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── dateHelpers.ts
│   ├── costCalculations.ts
│   └── chartHelpers.ts
├── App.tsx
├── App.css
└── index.tsx
```

---

## Component Hierarchy

```
App
├── AuthProvider
│   ├── ProtectedRoute
│   │   ├── LoginPage
│   │   ├── MainLayout
│   │   │   ├── Header
│   │   │   ├── DivisionSelector
│   │   │   ├── Sidebar
│   │   │   ├── Main Content Area
│   │   │   │   ├── DashboardPage
│   │   │   │   │   ├── OverallDashboard (role: Div Manager, Finance, Controls)
│   │   │   │   │   │   ├── DashboardFilters
│   │   │   │   │   │   ├── BudgetMetricsCard (4x)
│   │   │   │   │   │   └── ProjectCardList
│   │   │   │   │   │       └── ProjectCard (clickable)
│   │   │   │   │   ├── ClientDashboard
│   │   │   │   │   │   ├── ClientProjectList
│   │   │   │   │   │   └── ClientBudgetSummary
│   │   │   │   │   └── ProjectDashboard
│   │   │   │   │       ├── ProjectHeader
│   │   │   │   │       ├── ApprovalCheckbox (PM only)
│   │   │   │   │       ├── BudgetMetrics
│   │   │   │   │       ├── Tabs
│   │   │   │   │       │   ├── Summary Tab
│   │   │   │   │       │   │   └── BudgetBreakdown
│   │   │   │   │       │   │       └── BudgetTierCard (repeating)
│   │   │   │   │       │   ├── Daily Entry Tab
│   │   │   │   │       │   │   └── DailyEntryScreen
│   │   │   │   │       │   └── Activity Log Tab
│   │   │   │   │       │       └── ActivityLogView
│   │   │   │   │
│   │   │   │   ├── ProjectsPage
│   │   │   │   │   ├── ProjectList
│   │   │   │   │   │   └── ProjectCard (repeating)
│   │   │   │   │   ├── Filters
│   │   │   │   │   └── Pagination
│   │   │   │   │
│   │   │   │   ├── ProjectSetupPage
│   │   │   │   │   └── ProjectSetupWizard
│   │   │   │   │       ├── SetupStep1_BasicInfo
│   │   │   │   │       ├── SetupStep2_BillingLines
│   │   │   │   │       ├── SetupStep3_CostCodes
│   │   │   │   │       │   └── CostCodeTable
│   │   │   │   │       ├── SetupStep4_Rates
│   │   │   │   │       │   ├── CopyRatesModal
│   │   │   │   │       │   └── RatesForm
│   │   │   │   │       └── SetupStep5_Review
│   │   │   │   │
│   │   │   │   ├── DailyEntryPage
│   │   │   │   │   └── DailyEntryScreen
│   │   │   │   │       ├── DateSelector
│   │   │   │   │       ├── TimeEntryForm
│   │   │   │   │       ├── EquipmentEntryForm
│   │   │   │   │       ├── MaterialEntryForm
│   │   │   │   │       ├── DailySummary
│   │   │   │   │       └── ActivityLogSection
│   │   │   │   │           └── AddActivityModal
│   │   │   │   │
│   │   │   │   └── AdminPage
│   │   │   │       ├── EmployeeManager
│   │   │   │       │   ├── EmployeeTable
│   │   │   │       │   └── AddEmployeeModal
│   │   │   │       ├── PositionRatesManager
│   │   │   │       │   ├── PositionRateTable
│   │   │   │       │   └── EditRateModal
│   │   │   │       └── CostTypeManager
│   │   │   │           └── CostTypeTable
│   │   │   └── Footer
│   │   └── NotFoundPage
```

---

## Global State (Context)

### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedDivision: Division | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedDivision: (division: Division) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

**Consumed by:**
- ProtectedRoute (check isAuthenticated)
- Header (display user name, logout button)
- DivisionSelector (get/set selectedDivision)
- All pages (check user roles)

---

## Key Components (Detailed)

### 1. LoginPage
```typescript
interface LoginPageProps {
  onLoginSuccess: () => void; // Redirect to dashboard
}

// State: email, password, isLoading, error
// Calls: authService.login()
// Navigates: to /dashboard on success
```

### 2. DailyEntryScreen
**Most complex component.** Handles time, equipment, material entry + activity log.

```typescript
interface DailyEntryScreenProps {
  projectId: string;
  date: Date; // Picked by DateSelector
}

// Local State:
interface DailyEntryState {
  selectedDate: Date;
  timeEntries: TimeEntry[];
  equipmentEntries: EquipmentEntry[];
  materialEntries: MaterialEntry[];
  dailySummary: DailySummary;
  budgetStatus: BudgetStatus[];
  activityLogs: ActivityLog[];
}

// Sub-components:
// - DateSelector (pick date, controls re-render)
// - TimeEntryForm (employee → position → rates auto-pull)
// - EquipmentEntryForm (equipment → quantity → rate → cost)
// - MaterialEntryForm (invoice → amount)
// - DailySummary (cost by CC, total for day, budget alerts)
// - ActivityLogSection (narrative notes)
// - EntryList (today's entries, editable until locked)
```

**Key logic:**
- When employee selected → fetch position from employees list → pull rates
- When equipment selected → fetch rates from equipment list
- On time entry submit → calculate costs, save, refresh daily summary
- On lock → disable all entries, show lock icon

### 3. BudgetBreakdown
Shows three-tier budget (Budget | FIWP Hours | Actual) for each cost code.

```typescript
interface BudgetBreakdownProps {
  projectId: string;
  costCodes: ProjectCostCode[];
}

// Fetches: GET /projects/:projectId/budget/cost-codes
// Renders: BudgetTierCard for each cost code
// Logic: Calculate variance (Budget - Actual, FIWP - Actual), % complete
```

### 4. ProjectSetupWizard
Multi-step wizard for project configuration.

```typescript
interface SetupWizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  formData: {
    basicInfo: ProjectBasicInfo;
    billingLines: BillingLine[];
    costCodes: CostCodeSetup[];
    positionRates: PositionRate[];
    equipmentList: Equipment[];
  };
  errors: Record<string, string>;
}

// Steps:
// 1. Basic info (name, PO, dates, PM, foreman)
// 2. Billing lines (1-12)
// 3. Cost codes (add from master, allocate budget, map to Jonas cost type)
// 4. Rates (create or copy from other project, allow adjust)
// 5. Review & confirm
```

### 5. OverallDashboard
Rollup view for Division Manager, Finance, Project Controls.

```typescript
interface OverallDashboardProps {
  divisionId: string;
  dateRange: DateRange; // from, to
}

// Fetches: GET /divisions/:divisionId/budget?date_from=...&date_to=...
// Renders:
// - DashboardFilters (division, date range)
// - 4x BudgetMetricsCard (Total Budget, Actual, Remaining, % Used)
// - ProjectCardList (all projects in division, grouped by client)
// - CostTypeBreakdown (chart: budget vs actual by cost type)
```

---

## Component Props & Types

### BudgetTierCard
```typescript
interface BudgetTierCardProps {
  costCodeId: string;
  description: string;
  phase: string;
  budget: number;
  fiwpHours: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  percentOfFIWP: number;
}

// Renders: Table with 3 rows (Budget, FIWP Hours, Actual)
// Colored: Green if under budget, amber if 80%+, red if over
// Shows: Variance calculations
```

### TimeEntryForm
```typescript
interface TimeEntryFormProps {
  projectId: string;
  selectedDate: Date;
  employees: Employee[];
  costCodes: ProjectCostCode[];
  positionRates: PositionRate[];
  onSave: (entry: TimeEntry) => Promise<void>;
  onCancel: () => void;
}

interface TimeEntryFormState {
  selectedEmployee: Employee | null;
  selectedPosition: Position | null; // Auto-filled from employee
  selectedCostCode: CostCode | null;
  regularHours: number;
  overtimeHours: number;
  travelHours: number;
  regularRate: number; // Auto-pulled
  overtimeRate: number;
  travelRate: number;
  totalCost: number; // Auto-calculated
  comments: string;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// Logic:
// - onChange employee → lookup position → pull rates
// - onChange hours → recalculate costs
// - onSubmit → validate, POST /projects/:projectId/daily-entries/time
```

### ProjectCard
```typescript
interface ProjectCardProps {
  project: Project;
  budgetSummary: BudgetSummary;
  onClick: (projectId: string) => void;
}

// Renders: Card with project name, PO, budget, actual, remaining, % progress bar
// Status badge: Active (green), At Risk (amber), On Track (green)
// Clickable: Routes to ProjectDetailPage
```

### ActivityLogSection
```typescript
interface ActivityLogSectionProps {
  projectId: string;
  dateRange: DateRange;
}

interface ActivityLogEntry {
  activity_id: string;
  date_of_activity: string;
  activity_type: 'WORK_PERFORMED' | 'MATERIAL_ORDERED' | 'MATERIAL_RECEIVED' | 'OTHER';
  notes: string;
  entered_by: string;
  entered_at: string;
}

// Renders: List of activity entries, color-coded by type
// Modal: "Add Activity" button opens AddActivityModal
// API: GET /projects/:projectId/activity-log, POST /projects/:projectId/activity-log
```

---

## State Management Strategy

### 1. Global State (Context)
- **Auth:** User, token, selected division
- **Why:** Needed across many pages (header, sidebar, all content)

### 2. Local State (useState)
- **Page state:** Active tab, filters, pagination offset
- **Form state:** Form inputs, validation errors
- **UI state:** Loading spinners, modals open/closed
- **Why:** Scoped to single component or immediate children

### 3. Server State (API calls)
- **Fetch on mount:** useEffect → API call → setState
- **Cache strategy:** No caching (MVP). Each page refetches on mount.
- **Error handling:** Try/catch, show error Alert
- **Loading:** Show Spinner while fetching

### 4. Local Storage (optional)
- **Store:** Selected division (so it persists across sessions)
- **Retrieve:** On app load, set in AuthContext
- **Why:** Better UX (user doesn't have to re-select division)

---

## Data Flow Patterns

### Pattern 1: Daily Entry Flow
```
DailyEntryScreen (state: selectedDate, entries)
  ↓
DateSelector (onChange → update selectedDate, refetch entries)
  ↓
TimeEntryForm
  - Employee dropdown → lookup position from employees
  - Position → pull rates from positionRates
  - Cost code dropdown
  - Hours input → calc costs
  - onSave → POST /projects/:projectId/daily-entries/time
  ↓
DailySummary (reads: timeEntries, equipmentEntries, materialEntries)
```

### Pattern 2: Budget Query Flow
```
ProjectDashboard (props: projectId)
  ↓
BudgetBreakdown (fetches on mount)
  - useEffect → GET /projects/:projectId/budget/cost-codes
  - setState(costCodes)
  ↓
BudgetTierCard[] (renders one per cost code)
  - Props: budget, fiwpHours, actual, remaining, percentUsed
  - Calc on component (no expensive calculations in render)
```

### Pattern 3: Project Setup Flow
```
ProjectSetupPage (route: /projects/new)
  ↓
ProjectSetupWizard (state: currentStep, formData)
  - Step 1: Collect basic info
  - Step 2: Add billing lines
  - Step 3: Add cost codes from master list
  - Step 4: Set rates (copy or create)
  - Step 5: Review all
  ↓
onComplete → POST /projects → Redirect to /projects/:projectId
```

---

## Navigation Flow

```
LoginPage
  ↓ (on login success)
DashboardPage (default: OverallDashboard for user's division)
  ↓
ProjectsPage (list all projects)
  ↓ (click project)
ProjectDetailPage (/projects/:projectId)
  - Tabs: Summary, Daily Entry, Activity Log
  ↓ (click "Daily Entry")
DailyEntryScreen (embedded in ProjectDetailPage or separate route)
  ↓
ActivityLogPage (/projects/:projectId/activity-log)

ProjectSetupPage (/projects/new)
  - Wizard: 5 steps
  ↓ (complete)
ProjectDetailPage (/projects/:projectId)

AdminPage (/admin)
  - Employees, Position Rates, Cost Types
```

**Route structure:**
```typescript
const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/projects', element: <ProtectedRoute><ProjectsPage /></ProtectedRoute> },
  { path: '/projects/new', element: <ProtectedRoute><ProjectSetupPage /></ProtectedRoute> },
  { path: '/projects/:projectId', element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute> },
  { path: '/projects/:projectId/daily-entry', element: <ProtectedRoute><DailyEntryPage /></ProtectedRoute> },
  { path: '/admin', element: <ProtectedRoute><AdminPage /></ProtectedRoute> },
  { path: '*', element: <NotFoundPage /> },
];
```

---

## Reusable Components (Shared)

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'; // Primary is blue, secondary is outline, danger is red
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode; // For action buttons
  size?: 'sm' | 'md' | 'lg';
}
```

### FormInput
```typescript
interface FormInputProps {
  label: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'password';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

### Select
```typescript
interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}
```

### Table
```typescript
interface TableProps<T> {
  columns: { header: string; accessor: keyof T; render?: (value: T[keyof T]) => React.ReactNode }[];
  data: T[];
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  pagination?: boolean;
}
```

### Card
```typescript
interface CardProps {
  title?: string;
  children: React.ReactNode;
  onClick?: () => void;
  footer?: React.ReactNode;
}
```

### Badge
```typescript
interface BadgeProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}
// Colors: info=blue, success=green, warning=amber, danger=red
```

---

## Custom Hooks

### useAPI
```typescript
function useAPI<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  dependencies: any[] = []
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<T | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api[method.toLowerCase()](url, data);
        setResponse(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, dependencies);

  return { loading, error, response };
}

// Usage:
const { loading, error, response: budgetData } = useAPI<BudgetBreakdown>(
  `/projects/${projectId}/budget/cost-codes`,
  'GET',
  null,
  [projectId]
);
```

### usePagination
```typescript
function usePagination<T>(items: T[], itemsPerPage: number = 50) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return { paginatedItems, currentPage, totalPages, setCurrentPage };
}
```

### useForm
```typescript
function useForm<T>(initialValues: T, onSubmit: (values: T) => Promise<void>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, handleChange, handleSubmit, errors, isSubmitting };
}
```

---

## TypeScript Types (key ones)

```typescript
// User & Auth
interface User {
  user_id: string;
  email: string;
  full_name: string;
  assigned_divisions: string[];
  roles: Role[];
}

type Role = 'Foreman' | 'Worker' | 'PM' | 'PC' | 'PA' | 'Controls' | 'Div_Manager';

// Project
interface Project {
  project_id: string;
  project_name: string;
  project_number: string;
  po_number: string;
  po_value: number;
  budget_type: 'PROJECT' | 'SERVICE';
  start_date: string;
  end_date: string;
  pm_name: string;
  foreman_name: string;
  client_approval_locked: boolean;
  client_approval_date: string | null;
}

// Budget
interface BudgetBreakdown {
  cost_code_id: string;
  description: string;
  cost_type: 'LABOUR' | 'EQUIPMENT' | 'MATERIAL' | 'FREIGHT';
  execution_phase: string;
  budget_allocated: number;
  fiwp_hours: number;
  actual_cost: number;
  remaining_budget: number;
  percent_used: number;
}

// Entries
interface TimeEntry {
  time_entry_id: string;
  employee_name: string;
  cost_code_id: string;
  regular_hours: number;
  overtime_hours: number;
  travel_hours: number;
  regular_cost: number;
  overtime_cost: number;
  travel_cost: number;
  total_cost: number;
  date_of_work: string;
}

interface EquipmentEntry {
  equipment_entry_id: string;
  equipment_name: string;
  cost_code_id: string;
  usage_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  quantity: number;
  rate: number;
  total_cost: number;
  date_of_work: string;
}

interface MaterialEntry {
  material_entry_id: string;
  invoice_date: string;
  invoice_po_number: string;
  vendor: string;
  description: string;
  cost_code_id: string;
  amount: number;
}

// Rates
interface Employee {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  position_name: string;
}

interface PositionRate {
  rate_id: string;
  position_name: string;
  regular_rate: number;
  overtime_rate: number;
  travel_time_rate: number;
}
```

---

## Styling Strategy

**Option 1: Tailwind CSS**
- Install: `npm install -D tailwindcss`
- Use utility classes: `className="bg-blue-500 text-white px-4 py-2 rounded"`
- Pros: Fast, responsive, built-in dark mode
- Cons: Large classNames

**Option 2: CSS Modules**
- Create: `Button.module.css`
- Import: `import styles from './Button.module.css'`
- Use: `className={styles.button}`
- Pros: Scoped, traditional CSS
- Cons: More verbose, no utility classes

**Recommendation:** Tailwind for MVP (faster development).

---

## Summary

**Component Hierarchy:** 
- 40+ components (pages, features, shared)
- Organized by feature (daily-entry, projects, setup, etc.)
- Reusable components in shared/ folder

**State Management:**
- Global: AuthContext (user, token, division)
- Local: useState for page/form state
- Server: useAPI hook for fetching

**Data Flow:**
- Components fetch on mount (useEffect)
- Pass data down as props
- Bubbling up through callbacks (onClick, onSave)

**Navigation:**
- React Router v6 with 6 main routes
- Nested routes under /projects/:projectId

**Types:**
- TypeScript interfaces for all major entities
- Generated from API spec (matching request/response shapes)

**Ready to start coding this?** Or review first?
