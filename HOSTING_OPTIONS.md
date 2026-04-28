# LEM App - Testing Hosting Options

Choose where to deploy backend and frontend for MVP testing.

---

## Quick Comparison

| Provider | Backend | Frontend | Pricing | Setup Time | Best For |
|----------|---------|----------|---------|-----------|----------|
| **Vercel** | ❌ (JS/Node only) | ✅ | Free tier | 5 min | React app |
| **Railway** | ✅ | ✅ | $5/mo | 10 min | Full stack MVP |
| **Render** | ✅ | ✅ | Free tier | 10 min | Full stack test |
| **Fly.io** | ✅ | ✅ | Free tier | 15 min | Production-ready |
| **Heroku** | ✅ | ✅ | Paid ($7+) | 10 min | Was the standard |
| **AWS** | ✅ | ✅ | Free tier | 30 min | Enterprise |
| **DigitalOcean** | ✅ | ✅ | $4+/mo | 20 min | Lightweight |
| **Local Machine** | ✅ | ✅ | Free | 5 min | Your laptop |

---

## 🥇 BEST FOR MVP TESTING: Railway

**Why Railway:**
- ✅ Deploy both backend + frontend
- ✅ Automatic database (PostgreSQL)
- ✅ Free tier with $5 monthly credit
- ✅ Simple UI, GitHub integration
- ✅ Environment variables built-in
- ✅ Perfect for testing before production

### Railway Setup (15 minutes)

**1. Create Railway Account**
```
https://railway.app/
Sign up with GitHub
```

**2. Create New Project**
- Click "New Project"
- Select "Deploy from GitHub"
- Connect your GitHub repo (or upload files)

**3. Add PostgreSQL Database**
- In project dashboard, click "Add Service"
- Select "PostgreSQL"
- Railway auto-creates the database

**4. Deploy Backend**
- Connect your backend GitHub repo (or upload)
- Railway auto-detects Node.js
- Add environment variables:
  ```
  DB_HOST=your-postgres-host
  DB_PORT=5432
  DB_NAME=lem_app
  DB_USER=postgres
  DB_PASSWORD=your-password
  JWT_SECRET=your-secret-key
  NODE_ENV=production
  PORT=3001
  FRONTEND_URL=https://your-frontend-url.vercel.app
  ```

**5. Deploy Frontend**
- Separate project or same project
- Connect React GitHub repo
- Railway auto-builds with Vite
- Add environment variable:
  ```
  VITE_API_URL=https://your-backend-railway-url/api
  ```

**6. Get URLs**
- Backend: `https://your-app-backend.railway.app`
- Frontend: `https://your-app-frontend.railway.app`
- Share with team for testing

**Cost:** Free tier covers testing; upgrade to $5/month for production

---

## 🏃 FASTEST: Local Machine + ngrok (Instant Testing)

**Why Local:**
- ✅ Free
- ✅ Test immediately
- ✅ No deployment needed
- ✅ Full control
- ✅ Easy debugging

### Local Setup (5 minutes)

**1. Start Backend Locally**
```bash
cd backend
npm install
npm run migrate    # Create database
npm run dev        # Runs on :3001
```

**2. Start Frontend Locally**
```bash
cd frontend
npm install
npm run dev        # Runs on :3000
```

**3. Access Locally**
```
Frontend: http://localhost:3000
Backend: http://localhost:3001
```

**4. Share with Team (Optional - ngrok)**
If you want teammates to test:
```bash
# Install ngrok
brew install ngrok

# Expose backend
ngrok http 3001
# Shows: https://xxxx-xxxx.ngrok.io

# Expose frontend
ngrok http 3000
# Shows: https://yyyy-yyyy.ngrok.io

# Update frontend .env:
VITE_API_URL=https://xxxx-xxxx.ngrok.io/api

# Share URLs with team
```

**Cost:** Free

---

## 🚀 PRODUCTION-READY: Render.com

**Why Render:**
- ✅ Free tier (with limitations)
- ✅ Auto-deploys from GitHub
- ✅ Built-in PostgreSQL
- ✅ Easy SSL/HTTPS
- ✅ Good for small teams

### Render Setup (20 minutes)

**1. Create Render Account**
```
https://render.com/
Sign up with GitHub
```

**2. Create PostgreSQL Database**
- Dashboard → "New +"
- Select "PostgreSQL"
- Choose free tier ($0/month)
- Note connection string

**3. Create Backend Service**
- Dashboard → "New +"
- Select "Web Service"
- Connect GitHub repo (backend folder)
- Settings:
  ```
  Build Command: npm install && npm run build
  Start Command: npm start
  Environment: Node
  ```
- Add environment variables (same as Railway)
- Deploy

**4. Create Frontend Service**
- Dashboard → "New +"
- Select "Static Site"
- Connect GitHub repo (frontend folder)
- Settings:
  ```
  Build Command: npm install && npm run build
  Publish Directory: dist
  ```
- Add environment variable:
  ```
  VITE_API_URL=https://your-backend-render.onrender.com/api
  ```
- Deploy

**5. Get URLs**
- Backend: `https://lem-app-backend.onrender.com`
- Frontend: `https://lem-app-frontend.onrender.com`

**Cost:** Free tier (with 15-min idle timeout), paid plans from $7/month

---

## 💰 CHEAPEST: DigitalOcean Droplet

**Why DigitalOcean:**
- ✅ $4/month for VPS
- ✅ Both frontend + backend on one server
- ✅ PostgreSQL included
- ✅ Full control, no limitations

### DigitalOcean Setup (30 minutes)

**1. Create Account & Droplet**
```
https://www.digitalocean.com/
Create new Droplet → Ubuntu 22.04 → $4/month plan
```

**2. SSH Into Droplet**
```bash
ssh root@your-droplet-ip
```

**3. Install Dependencies**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
apt install -y nginx

# Install PM2 (keep apps running)
npm install -g pm2
```

**4. Deploy Backend**
```bash
# Clone repo or upload files
git clone your-repo /var/www/lem-backend
cd /var/www/lem-backend
npm install

# Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE lem_app;
\q

# Run migrations
npm run migrate

# Start with PM2
pm2 start "npm start" --name "lem-backend"
pm2 save
```

**5. Deploy Frontend**
```bash
cd /var/www/lem-backend
npm run build

# Copy to Nginx
cp -r dist /var/www/lem-frontend
```

**6. Configure Nginx**
```
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-ip-or-domain;

    # Frontend
    location / {
        root /var/www/lem-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

**7. Restart Nginx**
```bash
systemctl restart nginx
```

**8. Access**
```
http://your-droplet-ip
```

**Cost:** $4-6/month

---

## 🔧 SETUP COMPARISON TABLE

| Task | Local | Railway | Render | DigitalOcean | AWS |
|------|-------|---------|--------|--------------|-----|
| Create account | N/A | 2 min | 2 min | 5 min | 5 min |
| Deploy backend | 5 min | 5 min | 10 min | 15 min | 20 min |
| Deploy frontend | 5 min | 5 min | 10 min | 10 min | 15 min |
| Add database | 5 min | Auto | Auto | 5 min | 10 min |
| Get live URL | Manual | Auto | Auto | Manual | Manual |
| Custom domain | No | $12/mo | $10/mo | $12/mo | $0 |
| **Total Time** | **15 min** | **15 min** | **25 min** | **40 min** | **50 min** |

---

## 📋 MY RECOMMENDATION FOR YOUR SITUATION

### Phase 1: Quick Test (Today)
**Use: Local Machine**
- Run both servers locally
- Test with demo data
- No payment needed
- Full debugging access

### Phase 2: Team Testing (This Week)
**Use: Railway** 
- Deploy both backend + frontend
- Free tier covers testing
- Share URLs with team
- Auto-deploys from GitHub
- Add $5/month if you want it running 24/7

### Phase 3: Production (Next Month)
**Choose from:**
- **Small team:** Railway ($5/mo) or DigitalOcean ($4/mo)
- **Enterprise:** AWS or Heroku
- **High-traffic:** Fly.io or Vercel (frontend only) + Railway (backend)

---

## 🚀 QUICKSTART: Deploy to Railway in 10 Minutes

### Step-by-Step

**1. Push Code to GitHub**
```bash
# Create GitHub repo
# Push backend folder to github.com/yourname/lem-app-backend
# Push frontend folder to github.com/yourname/lem-app-frontend
```

**2. Create Railway Account**
- Go to https://railway.app/
- Sign up with GitHub

**3. Deploy Backend**
- New Project → Deploy from GitHub
- Select `lem-app-backend` repo
- Add PostgreSQL service
- Add environment variables
- Done! Get URL from dashboard

**4. Deploy Frontend**
- New Project → Deploy from GitHub
- Select `lem-app-frontend` repo
- Add env var: `VITE_API_URL=https://your-backend-railway-url/api`
- Done! Get URL from dashboard

**5. Test**
```
Frontend: https://your-frontend.railway.app
Login with: pm@impact.com / demo123
```

**Cost:** Free tier ($5 credit/month)

---

## 🔒 Database Connection Strings

When deploying, you'll need this format:

```
PostgreSQL Connection String:
postgresql://username:password@host:port/database

Example:
postgresql://postgres:mypassword@db.railway.internal:5432/lem_app
```

**Environment Variables to Add:**
```
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=lem_app
DB_USER=postgres
DB_PASSWORD=your-secure-password
JWT_SECRET=generate-a-random-32-char-string
NODE_ENV=production
PORT=3001 (backend only)
FRONTEND_URL=https://your-frontend-url.com
VITE_API_URL=https://your-backend-url.com/api (frontend only)
```

---

## ⚠️ Important Before Deploying

**1. Generate JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2. Update CORS**
In `backend/src/server.ts`, change:
```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
```

**3. Database URL Format**
Most platforms provide a connection string like:
```
postgresql://user:password@host:port/dbname
```

Update your `.env`:
```
DB_HOST=host
DB_PORT=port
DB_USER=user
DB_PASSWORD=password
DB_NAME=dbname
```

**4. Build Frontend**
```bash
cd frontend
npm run build
# Creates dist/ folder for deployment
```

---

## 🆘 Troubleshooting

**"Backend won't start"**
- Check logs in platform dashboard
- Verify database credentials
- Run `npm run migrate` locally first

**"Frontend can't reach backend"**
- Check `VITE_API_URL` environment variable
- Verify backend URL is correct (no trailing slash)
- Check browser console for CORS errors

**"Database connection failed"**
- Get connection string from dashboard
- Parse it correctly into separate env vars
- Verify firewall allows outbound connections

**"Port 3001 in use locally"**
```bash
lsof -ti:3001 | xargs kill -9
# Or use different port:
npm run dev -- --port 3002
```

---

## 💡 Recommendation for Your Use Case

**Start with:**
1. **Local testing** (your machine, today)
2. **Railway deployment** (team testing, free)
3. **Decide on final home** based on team size and budget

**Why this path:**
- Immediate testing without cost
- Team can review code while it's live
- Easy to migrate later without being locked in
- Railway can scale if needed

---

## Next Steps

1. **Pick your path** (local, Railway, or other)
2. **Follow setup guide** above
3. **Deploy** (5-30 minutes depending on choice)
4. **Test login** with demo credentials
5. **Share with team** for feedback

**Ready to deploy? Which option appeals most to you?**
