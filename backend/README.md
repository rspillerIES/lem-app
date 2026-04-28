# LEM App Backend

Daily Labor/Equipment/Material tracking and budget management system for Impact Energy Services.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (Mac with Homebrew)
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb lem_app

# Create user (if needed)
createuser -P postgres
```

**Option B: Docker**
```bash
docker run --name lem-postgres \
  -e POSTGRES_DB=lem_app \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lem_app
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key_at_least_32_characters_long
JWT_EXPIRATION=7d

NODE_ENV=development
PORT=3001

FRONTEND_URL=http://localhost:3000
```

### 4. Database Schema

Run migrations to create all tables:
```bash
npm run migrate
```

This will:
- Create all 26 tables (companies, projects, entries, etc.)
- Set up indexes
- Create constraints and relationships

## Development

### Start Server
```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── config/          # Database, environment config
├── middleware/      # Auth, error handling
├── routes/          # API endpoints (auth, projects, entries, etc.)
├── services/        # Business logic (project setup, budget calcs)
├── utils/           # Helper functions
├── types/           # TypeScript interfaces
├── scripts/         # Migration scripts
└── server.ts        # Express app setup
```

## API Endpoints

### Public
- `POST /api/auth/login` - Login

### Protected (requires auth token)

**Projects**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:projectId` - Get project details
- `POST /api/projects/:projectId/setup/cost-codes` - Add cost codes
- `POST /api/projects/:projectId/setup/billing-lines` - Add billing lines
- `POST /api/projects/:projectId/setup/employees` - Assign employees

**Daily Entries**
- `POST /api/projects/:projectId/daily-entries/time` - Save time entry
- `POST /api/projects/:projectId/daily-entries/equipment` - Save equipment entry
- `POST /api/projects/:projectId/daily-entries/material` - Save material entry
- `GET /api/projects/:projectId/daily-entries` - Get entries

**Budget & Dashboard**
- `GET /api/projects/:projectId/budget/cost-codes` - Get budget breakdown
- `GET /api/divisions/:divisionId/budget` - Get division dashboard
- `GET /api/clients/:clientId/budget` - Get client budget

**Activity Log**
- `POST /api/projects/:projectId/activity-log` - Add activity note
- `GET /api/projects/:projectId/activity-log` - Get activity log

**Export**
- `POST /api/projects/:projectId/export/jonas` - Export to Jonas format (CSV)
- `POST /api/projects/:projectId/export/pdf` - Export to PDF

**Admin**
- `GET /api/employees` - List employees (company/division level)
- `POST /api/employees` - Create employee
- `GET /api/position-rates` - Get position rates
- `POST /api/position-rates` - Create/update position rates

## Error Handling

All errors return consistent format:
```json
{
  "error": "Human-readable error message",
  "status": 400,
  "field": "field_name (if validation error)",
  "timestamp": "2026-04-27T16:00:00Z"
}
```

Status codes:
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not authorized for resource)
- `404` - Not Found
- `500` - Server Error

## Testing

Run tests:
```bash
npm test
```

## Database Schema

See `../LEM_Database_Schema.md` for full schema documentation.

## API Specification

See `../LEM_API_Specification.md` for complete API documentation.

## Next Steps

1. ✅ Backend scaffolding (current)
2. Create auth service (login, user validation)
3. Create project service (CRUD, setup)
4. Create entry service (time, equipment, material)
5. Create budget calculations
6. Create export service (Jonas CSV, PDF)
7. Implement all routes
8. Create frontend

## Contributing

- Use TypeScript for all code
- Follow existing code structure
- Add types for all functions
- Include error handling
- Add JSDoc comments

## License

MIT
