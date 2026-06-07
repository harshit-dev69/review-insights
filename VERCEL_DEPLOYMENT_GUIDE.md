# 🚀 Vercel Deployment Guide for Sentiment Insights Hub

## Overview
This guide walks you through deploying the Sentiment Insights Hub AI to Vercel step-by-step.

---

## Prerequisites

✅ **Before starting, ensure you have:**
- A [Vercel account](https://vercel.com/signup)
- A [GitHub repository](https://github.com) (push your code there first)
- A PostgreSQL database (we recommend [Supabase](https://supabase.com) or [Railway](https://railway.app))
- [Clerk authentication](https://dashboard.clerk.com) set up with production keys
- AI API keys (HuggingFace, OpenAI, or Gemini)

---

## Step 1: Database Setup (Supabase Recommended)

### Create a PostgreSQL Database on Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Go to **Settings** → **Database** → Copy the **PostgreSQL Connection String**
4. Keep this URL safe - you'll need it for Vercel environment variables

**Run migrations locally before deploying:**
```bash
cd app
npm install
export DATABASE_URL="your-connection-string"
npx prisma migrate deploy
```

---

## Step 2: Push Code to GitHub

```bash
cd "d:\side quests\idp SENTI INSIGHTS\senti insights"
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/sentiment-insights.git
git branch -M main
git push -u origin main
```

---

## Step 3: Connect to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Click **Import**

### Configure Build Settings:
- **Framework**: Next.js ✅ (auto-detected)
- **Root Directory**: `app` (important - your Next.js app is in the app folder)
- **Build Command**: `npm run build` ✅ (already in package.json)
- **Output Directory**: `.next` ✅ (default)
- **Install Command**: `npm install` ✅

---

## Step 4: Set Environment Variables on Vercel

On the Vercel deployment page, add all the variables from [app/.env.example](app/.env.example):

### **Required - Database:**
```
DATABASE_URL = postgresql://user:password@host:5432/database
```

### **Required - Clerk Authentication:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_xxxxx
CLERK_SECRET_KEY = sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
```

### **Required - App URLs:**
```
NEXT_PUBLIC_APP_URL = https://your-vercel-domain.vercel.app
NEXT_PUBLIC_API_BASE_URL = https://your-vercel-domain.vercel.app
```

### **Optional - AI Services (at least one required):**
```
HUGGINGFACE_API_KEY = hf_xxxxx (recommended for sentiment analysis)
OPENAI_API_KEY = sk-proj-xxxxx (alternative)
GEMINI_API_KEY = xxxxx (alternative)
```

### **Important - Disable Test Mode:**
```
NEXT_PUBLIC_TEST_MODE = false
```

---

## Step 5: Update Clerk Settings for Production

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your production instance
3. Go to **Domains** → Add your Vercel domain:
   - Add: `https://your-vercel-domain.vercel.app`
   - Add: `https://your-custom-domain.com` (if you have one)
4. Go to **API Keys** and copy your **production keys**
5. Update the env vars on Vercel with these production keys

---

## Step 6: Deploy

Click **Deploy** on Vercel. The build should:
1. Install dependencies ✅
2. Run `prisma generate` ✅
3. Build Next.js app ✅
4. Create `.next` folder ✅

**This takes 2-5 minutes.** Monitor the logs for any errors.

---

## Step 7: Run Database Migrations

After the first successful deployment:

1. Go to your Vercel project dashboard
2. Open the **Function Logs** to verify the deployment was successful
3. Run migrations using Prisma (if you haven't already):

```bash
# From your local machine
export DATABASE_URL="your-supabase-url"
npx prisma migrate deploy
```

Alternatively, connect directly to your Supabase database and run migrations through their SQL editor.

---

## Step 8: Test Your Deployment

1. Go to your Vercel URL: `https://your-vercel-domain.vercel.app`
2. You should see the landing page ✅
3. Try signing up with Clerk ✅
4. Create a workspace and test the dashboard ✅
5. Test uploading a CSV file with reviews ✅

---

## Common Issues & Solutions

### ❌ "DATABASE_URL is required"
- **Cause**: Environment variable not set on Vercel
- **Fix**: Go to Vercel project → Settings → Environment Variables → Add `DATABASE_URL`

### ❌ "Clerk authentication failed"
- **Cause**: Test keys instead of production keys, or domain not added to Clerk
- **Fix**: 
  - Use production keys from Clerk Dashboard
  - Add your Vercel domain to Clerk → Domains

### ❌ "Build fails with 'app not found'"
- **Cause**: Root Directory not set correctly
- **Fix**: In Vercel settings, set **Root Directory** to `app`

### ❌ "Migrations didn't run"
- **Cause**: Migrations run at build time (via `prisma generate && next build`)
- **Fix**: Run `npx prisma migrate deploy` from your local machine with production DATABASE_URL

### ❌ "AI analysis returns 401 error"
- **Cause**: Missing or invalid AI API key
- **Fix**: Go to Vercel → Settings → Environment Variables → Add `HUGGINGFACE_API_KEY` or other AI provider key

---

## Monitoring & Debugging

### View Deployment Logs:
1. Go to your Vercel project
2. Click on a deployment in the **Deployments** tab
3. Check **Build Logs** or **Function Logs**

### Real-time Errors:
- Next.js errors appear in **Function Logs**
- Database connection errors appear here too
- API failures are logged with full error messages

### Check Database Connection:
```bash
export DATABASE_URL="your-supabase-url"
npx prisma db execute --stdin < /dev/null
# If successful, database is reachable
```

---

## Performance Optimization (Optional)

### Enable Database Connection Pooling:
If using Supabase, enable connection pooling:
1. Supabase Dashboard → **Project** → **Database** → **Connection Pooling**
2. Set Mode: **Transaction** (recommended for Prisma)
3. Use the pooling connection string in `DATABASE_URL`

### Image Optimization:
- All images are already optimized (Lucide icons, static assets)
- No additional setup needed ✅

---

## After Deployment

### ✅ Checklist:
- [ ] Database is connected and migrations ran
- [ ] Clerk authentication works
- [ ] Landing page loads
- [ ] Sign-up/Sign-in works
- [ ] Dashboard loads
- [ ] CSV upload and AI analysis works
- [ ] Analytics dashboard displays data correctly
- [ ] Complaint tracking shows negative reviews

### 🔐 Security:
- [ ] `.env` file is in `.gitignore` ✅ (already done)
- [ ] Test mode is disabled in production ✅ (already fixed)
- [ ] All API keys are in Vercel secrets, NOT in code ✅
- [ ] Database credentials are never exposed ✅

---

## Need Help?

- **Clerk Issues**: [Clerk Docs](https://clerk.com/docs)
- **Prisma Issues**: [Prisma Docs](https://www.prisma.io/docs/)
- **Vercel Issues**: [Vercel Docs](https://vercel.com/docs)
- **Supabase Issues**: [Supabase Docs](https://supabase.com/docs)

---

## Rolling Back

If something goes wrong, Vercel auto-saves previous deployments:
1. Go to **Deployments** tab
2. Find a previous stable version
3. Click **Promote to Production**

No manual rollback needed! ✅
