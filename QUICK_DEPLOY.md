# Quick Vercel Deployment Reference

## TL;DR - Quick Deploy Steps

### 1. Prepare Code
```bash
cd app
npm install
npm run build  # Test build locally
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. Create Vercel Project
- Go to https://vercel.com/dashboard
- Click "Add New" → "Project"  
- Select your repository
- **Set Root Directory to: `app`** ⚠️
- Click "Deploy"

### 4. Add Env Variables on Vercel
Go to Project Settings → Environment Variables and add:

```
DATABASE_URL = postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
CLERK_SECRET_KEY = sk_live_...
NEXT_PUBLIC_APP_URL = https://xxx.vercel.app
NEXT_PUBLIC_API_BASE_URL = https://xxx.vercel.app
HUGGINGFACE_API_KEY = hf_...
NEXT_PUBLIC_TEST_MODE = false
```

### 5. Deploy
Vercel builds automatically. Check deployment logs for errors.

### 6. Test
Visit your deployed URL and test sign-up, upload, and analysis.

---

## Critical Fixes Applied ✅

1. **Clerk Redirects**: Fixed hardcoded localhost URLs
2. **Test Mode**: Disabled for production
3. **Environment Template**: Created .env.example

---

## Pre-Flight Checklist (Required Before Deploy)

- [ ] Have PostgreSQL connection string ready
- [ ] Have Clerk production keys
- [ ] Have at least one AI API key (HF/OpenAI/Gemini)
- [ ] Code pushed to GitHub
- [ ] Prisma migrations ready

---

## Support

See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.
See `DEPLOYMENT_CHECKLIST.md` for full verification steps.
