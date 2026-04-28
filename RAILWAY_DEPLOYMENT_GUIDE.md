# Deploy LEM App to Railway (Cloud-Only, No Local Setup)

**Everything happens in the cloud. No local machine needed. 15 minutes to live testing.**

---

## What is Railway?

Railway is a cloud platform that hosts your app. Think of it as a container in the cloud where your code runs.

**You don't need:**
- Local machine setup
- Database installation
- Server configuration
- Any technical infrastructure

**You get:**
- Live URL immediately
- Automatic database
- Automatic SSL/HTTPS
- Easy environment variables
- Shareable link for team testing

---

## Step 1: Upload Your Code to GitHub

**Why GitHub?** Railway deploys directly from GitHub. It's the easiest method.

### Option A: Create New GitHub Repo (Easiest)

1. **Go to github.com and sign in** (create account if needed)
2. **Click "+" → "New repository"**
3. **Name it:** `lem-app` (or anything)
4. **Select:** "Public" (so Railway can see it)
5. **Click "Create repository"**

### Option B: Upload Files Directly (No Git Knowledge)

1. **In your new GitHub repo**, click "Add file" → "Upload files"
2. **Drag and drop** these folders:
   - `backend/` folder
   - `frontend/` folder
3. **Commit** ("Commit changes")

**Your GitHub repo now has both backend and frontend code.**

---

## Step 2: Create Railway Account

1. **Go to https://railway.app/**
2. **Click "Get Started"**
3. **Sign up with GitHub** (easiest option)
4. **Authorize Railway** to access your GitHub

Done! You're logged in.

---

## Step 3: Create PostgreSQL Database (Automatic)

1. **Dashboard → "New Project"**
2. **Click "Provision PostgreSQL"**
3. **Select "Yes"** to create database
4. **Wait 30 seconds** (database is created)
5. **Click on PostgreSQL** in your project

You'll see connection details:
```
PGHOST=railway.internal
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=your-password
```

**Keep this tab open.** You'll need these values.

---

## Step 4: Deploy Backend

**In Railway Dashboard:**

1. **Click "New Service"** (or "+" icon)
2. **Select "GitHub Repo"**
3. **Find and select** your GitHub repo with the `backend/` folder
4. **Click "Deploy"**

Railway auto-detects it's Node.js and starts building.

**While it's building (2-3 min), add environment variables:**

1. **Click on the backend service** in your project
2. **Go to "Variables"** tab
3. **Add these variables** (copy from PostgreSQL connection details):

```
DB_HOST = railway.internal
DB_PORT = 5432
DB_NAME = railway
DB_USER = postgres
DB_PASSWORD = [get from PostgreSQL service]
JWT_SECRET = your-secret-key-make-it-random
NODE_ENV = production
FRONTEND_URL = https://your-frontend-url.railway.app
```

**How to get DB_PASSWORD:**
- Click on PostgreSQL service
- Go to "Connect" tab
- Copy the password from the connection string

4. **The backend auto-redeploys** with new variables

**Get Your Backend URL:**
- In Railway dashboard, click backend service
- Go to "Networking" tab
- Copy the public URL (looks like: `https://lem-app-backend-prod.railway.app`)
- **Save this URL** — you'll need it for frontend

---

## Step 5: Run Database Migration

Your database exists but has no tables yet. Need to run the migration.

**Railway provides a terminal where you can run commands:**

1. **Click backend service** in Railway
2. **Go to "Deploy" tab**
3. **Scroll to "Run command"**
4. **Paste this:**
   ```
   npm run migrate
   ```
5. **Click "Run"**
6. **Wait for completion** (should see all 26 tables created)

If successful:
```
✓ Created companies table
✓ Created divisions table
✓ Created clients table
...
╔════════════════════════════════════════╗
║   Database Migration Complete!        ║
║   All 26 tables created successfully  ║
╚════════════════════════════════════════╝
```

---

## Step 6: Deploy Frontend

1. **In Railway, click "New Service"**
2. **Select "GitHub Repo"**
3. **Find and select** your GitHub repo with the `frontend/` folder
4. **Click "Deploy"**

**While building, add environment variable:**

1. **Click frontend service**
2. **Go to "Variables"** tab
3. **Add this one variable:**

```
VITE_API_URL = https://your-backend-url.railway.app/api
```

(Replace with the backend URL you saved from Step 4)

4. **Save and redeploy**

**Get Your Frontend URL:**
- Click frontend service
- Go to "Networking"
- Copy the public URL (looks like: `https://lem-app-frontend-prod.railway.app`)

---

## Step 7: Test It!

1. **Open your frontend URL in browser**
   ```
   https://your-frontend-url.railway.app
   ```

2. **You should see the LEM App login page**

3. **Log in with demo credentials:**
   ```
   Email: pm@impact.com
   Password: demo123
   ```

4. **You should see the Projects dashboard**

✅ **It's working!**

---

## Step 8: Create Demo User (Backend Only)

The demo credentials won't exist yet. Need to create them via backend.

**Option A: Use Railway Terminal**

In Railway backend service, go to "Deploy" → "Run command":

```bash
node -e "
const api = require('./dist/services/authService.ts');
const db = require('./dist/config/database.ts');
// This would create the user but is complex in terminal
"
```

**Option B: Create via SQL (Easier)**

1. **Click PostgreSQL service** in Railway
2. **Go to "Connect"** tab
3. **Scroll to "Browser"**
4. **Click "PostgreSQL Browser"** (opens table viewer)
5. **Find "users" table**
6. **Click "+" to insert row**

Add:
```
user_id:     (auto-generate)
company_id:  (generate random UUID or use placeholder)
email:       pm@impact.com
full_name:   PM User
password_hash: demo123
```

Now you can log in!

---

## Troubleshooting

### "Frontend can't connect to backend"

1. **Check VITE_API_URL variable**
   - Should be: `https://your-backend-url.railway.app/api`
   - No trailing slash

2. **Redeploy frontend**
   - Go to frontend service
   - Click "Redeploy"

3. **Check browser console** (F12)
   - Look for error messages
   - Should show successful API call

### "Database migration failed"

1. **Check DB credentials** in backend variables
2. **Make sure PostgreSQL is running**
   - Go to PostgreSQL service
   - Should say "Active" or "Healthy"
3. **Try running migration again**

### "Login doesn't work"

1. **Verify user exists** in PostgreSQL browser
2. **Password should be plain text** for demo (upgrade to bcrypt later)
3. **Check JWT_SECRET** is set in backend variables

### "Page is blank"

1. **Check frontend build** succeeded
   - Go to frontend service → Deploy tab
   - Look for success message
2. **Hard refresh browser** (Cmd+Shift+R or Ctrl+Shift+R)
3. **Check browser console** for errors

---

## Share with Your Team

Once it's working, **share these URLs:**

```
Frontend (Main App):
https://your-frontend-url.railway.app

Backend API (For API testing):
https://your-backend-url.railway.app

Demo Login:
Email: pm@impact.com
Password: demo123
```

Team can:
- Click the frontend URL and test the app
- No installation needed
- No local setup needed
- Works on any device with internet

---

## Costs

**Railway Pricing:**
- **Free tier:** $5/month credit (enough for testing)
- **Usage-based:** You only pay for what you use
- **Typical test app:** $0-2/month

To check your usage:
- Railway dashboard → "Billing"
- Shows real-time usage and cost

---

## Next Steps After Testing

Once you've tested and are ready for production:

1. **Decide on final host**
   - Railway: $5-20/month (recommended)
   - DigitalOcean: $4-12/month
   - AWS: $0-50/month (more complex)

2. **Buy custom domain** (optional)
   - railway.app domains are free
   - Custom domains cost $12/year

3. **Set up CI/CD** (automatic deploys)
   - Already done! Every GitHub push auto-deploys

4. **Add team members**
   - Share Railway project access
   - They can see logs, update variables, redeploy

---

## Railway Dashboard Features

Once deployed, you have access to:

- **Logs** — See what's happening in real-time
- **Variables** — Change environment variables without code
- **Networking** — Get your public URLs
- **Metrics** — CPU, memory, disk usage
- **Deployments** — See all deployment history
- **Redeploy** — Push new code with one click

---

## Summary

**What you do:**
1. Upload code to GitHub (5 min)
2. Sign up on Railway (2 min)
3. Deploy backend (3 min)
4. Deploy frontend (3 min)
5. Run migration (1 min)
6. Add demo user (1 min)
7. Test (1 min)

**Total: 15 minutes to live, testable app**

**No local machine needed. Everything cloud-based. Shareable with your team.**

---

## Questions?

If anything is unclear or doesn't work, the error messages in Railway are usually helpful:

1. Click the service (backend/frontend)
2. Go to "Deploy" tab
3. Scroll to "Deployment logs"
4. Red text = errors
5. Copy the error and search it

**Ready to deploy?**
