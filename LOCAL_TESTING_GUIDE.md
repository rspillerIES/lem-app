# Backend Local Testing Guide

This guide walks you through setting up the LEM backend locally, testing the database connection, and verifying the server works.

---

## Prerequisites

- **Node.js** (v16+): https://nodejs.org/
- **PostgreSQL** (v12+) OR **Docker** (for containerized PostgreSQL)
- **curl** or **Postman** (for testing API endpoints)
- **Code editor** (VS Code recommended)

---

## Step 1: Copy Backend Files to Your Machine

All backend files are in `/home/claude/backend/` in the outputs folder.

Create a local directory and copy them:
```bash
# Create project directory
mkdir lem-app
cd lem-app

# Create backend subdirectory
mkdir backend
cd backend

# Copy all files from /home/claude/backend/ into this directory
# Structure should be:
# backend/
# ├── src/
# │   ├── config/
# │   │   └── database.ts
# │   ├── middleware/
# │   │   ├── auth.ts
# │   │   └── errors.ts
# │   ├── scripts/
# │   │   └── migrate.ts
# │   ├── types/
# │   │   └── index.ts
# │   ├── server.ts
# │   └── index.ts
# ├── package.json
# ├── tsconfig.json
# ├── .env.example
# ├── .gitignore
# └── README.md
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `pg` - PostgreSQL driver
- `typescript` - Type checking
- `ts-node` - Run TypeScript directly
- `nodemon` - Auto-restart on file changes
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

**Expected output:**
```
added 247 packages, and audited 248 packages in 2m
```

---

## Step 3: Set Up PostgreSQL

### Option A: Local PostgreSQL Installation

**macOS (Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start service
brew services start postgresql@15

# Verify installation
psql --version
# Output: psql (PostgreSQL) 15.x

# Connect to default database
psql postgres

# In psql, create the lem_app database:
CREATE DATABASE lem_app;

# Verify it was created:
\l

# Exit psql:
\q
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Connect to default database
sudo -u postgres psql

# In psql:
CREATE DATABASE lem_app;
\q
```

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, note the password you set for postgres user
3. Verify: Open Command Prompt, run `psql -U postgres` (enter password)

### Option B: Docker PostgreSQL

**If you have Docker installed:**
```bash
# Start PostgreSQL container
docker run --name lem-postgres \
  -e POSTGRES_DB=lem_app \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps

# You should see:
# CONTAINER ID   IMAGE         PORTS                    NAMES
# abc123def456   postgres:15   0.0.0.0:5432->5432/tcp   lem-postgres
```

---

## Step 4: Create .env File

```bash
# Copy the example
cp .env.example .env

# Edit .env
# macOS/Linux:
nano .env

# Windows (or use any text editor):
type .env.example > .env
# Then open .env in Notepad and edit
```

**Fill in .env with these values:**

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lem_app
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_characters_long_123456
JWT_EXPIRATION=7d

# Server
NODE_ENV=development
PORT=3001

# CORS
FRONTEND_URL=http://localhost:3000
```

**Notes:**
- If using Docker, password is `password` (as set above)
- If using local PostgreSQL on macOS, password might be empty or what you set during install
- JWT_SECRET should be at least 32 characters (for security)
- On Windows, you might need to use `postgres` as the user

---

## Step 5: Create Database Tables (Run Migration)

```bash
npm run migrate
```

**Expected output:**
```
Starting database migration...
✓ Connected to PostgreSQL database
✓ Created companies table
✓ Created divisions table
✓ Created clients table
✓ Created projects table
✓ Created users table
✓ Created user_divisions table
✓ Created default_role_permissions table
✓ Created project_role_permissions table
✓ Created master_cost_codes table
✓ Created position_rates table
✓ Created project_position_rates table
✓ Created company_employees table
✓ Created employees table
✓ Created billing_lines table
✓ Created project_cost_codes table
✓ Created equipment table
✓ Created daily_time_entries table
✓ Created daily_equipment_entries table
✓ Created daily_material_entries table
✓ Created activity_log table
✓ Created audit_trail table
✓ Created execution_phases table
✓ Created fiwp_register table
✓ Created cost_code_fiwp_mapping table

╔════════════════════════════════════════╗
║   Database Migration Complete!        ║
║   All 26 tables created successfully  ║
╚════════════════════════════════════════╝

Migration script finished
```

**If you get an error:**
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Verify PostgreSQL is running: `psql -U postgres -d lem_app`
- Check database exists: `psql -U postgres -l | grep lem_app`

---

## Step 6: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
╔════════════════════════════════════════╗
║   LEM App Backend - Server Running     ║
║   Port: 3001                           ║
║   Environment: development             ║
║   CORS Origin: http://localhost:3000   ║
╚════════════════════════════════════════╝
```

Server is now running on `http://localhost:3001`

---

## Step 7: Test the Server

### 7a. Health Check Endpoint (No Auth Required)

**Using curl:**
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2026-04-27T16:00:00.000Z"
}
```

**Using Postman:**
1. Open Postman
2. Create a new GET request
3. URL: `http://localhost:3001/health`
4. Click Send
5. You should see the response above in the Body tab

### 7b. Test 404 Handler

```bash
curl http://localhost:3001/nonexistent
```

**Expected response:**
```json
{
  "error": "Endpoint not found",
  "status": 404,
  "path": "/nonexistent",
  "timestamp": "2026-04-27T16:00:00.000Z"
}
```

---

## Step 8: Verify Database Tables

**Connect to the database and check tables:**

```bash
# Connect to lem_app database
psql -U postgres -d lem_app

# In psql, list all tables:
\dt

# You should see output like:
#                    List of relations
# Schema |         Name         | Type  | Owner
# --------+----------------------+-------+----------
#  public | activity_log         | table | postgres
#  public | audit_trail          | table | postgres
#  public | billing_lines        | table | postgres
#  public | companies            | table | postgres
#  public | cost_code_fiwp_mapping | table | postgres
#  public | daily_equipment_entries | table | postgres
#  ...
# (26 rows)

# View table structure:
\d companies

# Exit psql:
\q
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution 1: Verify PostgreSQL is running**
```bash
# Check if PostgreSQL service is running
# macOS:
brew services list | grep postgresql

# Ubuntu:
sudo systemctl status postgresql

# Docker:
docker ps | grep postgres
```

**Solution 2: Verify credentials in .env**
- Check DB_HOST (usually `localhost`)
- Check DB_PORT (usually `5432`)
- Check DB_USER (usually `postgres`)
- Check DB_PASSWORD

**Solution 3: Test connection directly**
```bash
psql -h localhost -U postgres -d lem_app -c "SELECT 1;"

# If this works, the database connection is fine
# If not, PostgreSQL is not running or credentials are wrong
```

---

### Issue: "Port 3001 already in use"

```bash
# Kill the process using port 3001
# macOS/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port in .env:
PORT=3002
```

---

### Issue: "Migration fails with error"

```bash
# Check the error message carefully
# Common issues:
# 1. Database doesn't exist → createdb lem_app
# 2. User doesn't have permissions → check DB_USER
# 3. Tables already exist → they'll be skipped (CREATE TABLE IF NOT EXISTS)

# Reset everything (careful - deletes all data):
dropdb lem_app
createdb lem_app
npm run migrate
```

---

### Issue: "npm run migrate command not found"

Verify `package.json` has this script:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "node dist/scripts/migrate.js"
  }
}
```

The migrate script runs the compiled JavaScript version. If you get an error, try:
```bash
# Build first
npm run build

# Then run migration
npm run migrate
```

---

## Verification Checklist

✅ Dependencies installed (`npm install` completed)  
✅ .env file created with correct credentials  
✅ PostgreSQL database created (`lem_app`)  
✅ Database tables created (`npm run migrate` succeeded)  
✅ Server starts without errors (`npm run dev`)  
✅ Health endpoint responds (`curl http://localhost:3001/health`)  
✅ Database has 26 tables (`\dt` in psql shows all tables)  

---

## Next Steps After Successful Test

Once everything is working:

1. **Keep server running** — `npm run dev` (leave terminal open)
2. **Services can now be built** — Next files: `authService.ts`, `projectService.ts`, etc.
3. **Test API endpoints** — As we build routes, we can test with curl or Postman
4. **Frontend setup** — After core backend works, scaffold React app

---

## Database Connection Flow (What's Happening)

When you run `npm run dev`:

```
1. src/index.ts starts the app
   ↓
2. src/server.ts loads Express and middleware
   ↓
3. src/config/database.ts creates PostgreSQL connection pool
   ↓
4. Pool connects to localhost:5432/lem_app
   ↓
5. Server listens on port 3001
   ↓
6. Ready to receive requests!
```

When you hit the `/health` endpoint:

```
1. Request comes to http://localhost:3001/health
   ↓
2. Express routes it to the health check handler
   ↓
3. Handler returns { status: "OK", timestamp: ... }
   ↓
4. Browser/curl receives JSON response
```

---

## Useful Development Commands

**Run server (with auto-reload on file changes):**
```bash
npm run dev
```

**Build TypeScript to JavaScript:**
```bash
npm run build
# Creates dist/ folder with compiled code
```

**Run compiled code:**
```bash
npm start
# Runs dist/server.js (for production)
```

**Connect to database:**
```bash
psql -U postgres -d lem_app
```

**Stop Docker container:**
```bash
docker stop lem-postgres
docker rm lem-postgres
```

**View server logs:**
Just watch the terminal where you ran `npm run dev`

---

## Expected Timeline

- **Database setup:** 2-5 minutes
- **Running migration:** 1-2 minutes
- **Starting server:** 5 seconds
- **Total:** ~10 minutes to full setup

---

**Ready to test? Let me know what happens at each step!**

If you hit any errors, share the full error message and I can help debug it.
