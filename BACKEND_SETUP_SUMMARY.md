# Backend Scaffolding - Setup Instructions

## ✅ Files Created

**Configuration & Setup:**
- `package.json` - Dependencies
- `.env.example` - Environment variables template
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules
- `README.md` - Setup and development guide

**Core Application:**
- `src/types/index.ts` - All TypeScript interfaces (26+ types)
- `src/config/database.ts` - PostgreSQL connection and query wrapper
- `src/middleware/auth.ts` - JWT authentication, token generation/verification
- `src/middleware/errors.ts` - Error handling and custom error class
- `src/server.ts` - Express app setup with CORS, middleware, error handler
- `src/index.ts` - Application entry point
- `src/scripts/migrate.ts` - Database migration (creates all 26 tables)

**Total: 10 files, ~1,000 lines of code**

---

## 🚀 Quick Start

### 1. Install & Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Create database
createdb lem_app

# Run migration (creates all 26 tables)
npm run migrate
```

**Option B: Docker PostgreSQL**
```bash
# Start container
docker run --name lem-postgres \
  -e POSTGRES_DB=lem_app \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Run migration
npm run migrate
```

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

Check health: `curl http://localhost:3001/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-04-27T16:00:00.000Z"
}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          ← PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.ts              ← JWT, roles, permissions
│   │   └── errors.ts            ← Error handling
│   ├── scripts/
│   │   └── migrate.ts           ← Database creation
│   ├── types/
│   │   └── index.ts             ← All TypeScript types
│   ├── server.ts                ← Express setup
│   └── index.ts                 ← Entry point
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 📚 What's Implemented

### ✅ Database Layer
- PostgreSQL connection pool (pg library)
- Query wrapper function with error handling
- Client retrieval for transactions
- Connection lifecycle management

### ✅ Authentication
- JWT token generation with expiration
- Token verification
- Express middleware for auth check
- Role-based access control (requireRole)
- Division access checking
- Password hashing utilities (bcrypt)

### ✅ Error Handling
- Custom AppError class
- Consistent error response format
- Status codes (200, 201, 400, 401, 403, 404, 500)
- Field-level validation errors
- Error middleware (catches all errors)

### ✅ Express Setup
- CORS configured for frontend
- Body parsing (JSON, URL-encoded)
- Health check endpoint
- 404 handler
- Error handler (last middleware)
- Port configuration from .env

### ✅ Database Schema
- 26 tables with relationships
- Foreign key constraints
- Indexes on frequently queried columns
- Unique constraints (duplicate prevention)
- Timestamps (created_at, updated_at)
- Migration script (creates everything)

### ✅ TypeScript Types
- User & Auth (AuthPayload, LoginRequest)
- Organization (Company, Division, Client, Project)
- Rates & Employees (Employee, PositionRate)
- Cost Codes (MasterCostCode, ProjectCostCode, Equipment)
- Daily Entries (Time, Equipment, Material)
- Budget (BudgetBreakdown, DashboardMetrics)
- Activity Log & Audit Trail
- FIWP (future integration ready)
- API Response structures

---

## ⚙️ Configuration

**Environment Variables (.env):**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lem_app
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key_at_least_32_chars
JWT_EXPIRATION=7d

NODE_ENV=development
PORT=3001

FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Testing the Setup

### 1. Verify Database Connection
```bash
npm run migrate
# Should output: ✓ Connected to PostgreSQL database, then create all tables
```

### 2. Verify Server Startup
```bash
npm run dev
# Should output: Server Running on Port 3001
```

### 3. Test Health Endpoint
```bash
curl http://localhost:3001/health
# Should return: {"status":"OK","timestamp":"..."}
```

---

## 📋 Next Files to Create

**Phase 1: Core Services (6 files)**
1. `src/services/authService.ts` - User login, validation
2. `src/services/projectService.ts` - Project CRUD, setup logic
3. `src/services/entryService.ts` - Save/fetch time, equipment, material entries
4. `src/services/budgetService.ts` - Budget calculations, three-tier logic
5. `src/services/exportService.ts` - Jonas CSV format, PDF generation
6. `src/services/activityLogService.ts` - Activity log CRUD

**Phase 2: API Routes (6 route files)**
1. `src/routes/auth.ts` - POST /auth/login
2. `src/routes/projects.ts` - Project CRUD, setup endpoints
3. `src/routes/entries.ts` - Daily entry endpoints
4. `src/routes/dashboards.ts` - Budget and dashboard queries
5. `src/routes/employees.ts` - Employee management
6. `src/routes/export.ts` - Export endpoints

**Phase 3: Utilities (2 files)**
1. `src/utils/calculations.ts` - Cost calcs, budget formulas
2. `src/utils/formatters.ts` - Date, currency, CSV formatting

---

## 🔍 Key Design Decisions

### Database
- **UUID primary keys** - scalable, no collision risk
- **Timestamps on all tables** - audit trail support
- **Foreign keys with CASCADE** - maintain referential integrity
- **Indexes on frequently queried columns** - query performance
- **Soft deletes via boolean fields** - keeps history

### Authentication
- **JWT tokens** - stateless, scalable
- **Role-based access** - flexible permissions
- **Division-based filtering** - multi-tenant support
- **Middleware pattern** - applies auth to all protected routes

### Error Handling
- **Consistent error format** - frontend knows what to expect
- **HTTP status codes** - proper REST semantics
- **Field-level errors** - validation feedback
- **Error middleware** - catches all unhandled errors

### TypeScript
- **Strict mode enabled** - catches errors early
- **All database records have types** - type safety
- **API request/response types** - frontend contracts
- **Optional fields where needed** - flexibility

---

## 📖 Documentation

- `README.md` - Setup, run, API overview
- `../LEM_Database_Schema.md` - Full schema with queries
- `../LEM_API_Specification.md` - 34 endpoints, request/response
- `../LEM_React_Component_Hierarchy.md` - Frontend structure

---

## ✨ What's Ready

✅ Development environment fully scaffolded  
✅ Database ready to create (via npm run migrate)  
✅ Express server ready to start  
✅ Authentication system in place  
✅ Error handling implemented  
✅ All types defined  
✅ 26-table schema created via migration  

## ⏭️ What's Next

The next files to create are the **services** (business logic) which handle:
- User login validation
- Project creation & setup
- Daily entry calculations
- Budget queries
- Export generation

Should I proceed with creating the first service file (`authService.ts`)?

Or would you like to:
1. Test the current setup locally first?
2. Review any of the files?
3. Proceed with services?

Let me know!
