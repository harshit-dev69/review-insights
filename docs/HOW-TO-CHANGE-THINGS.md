# 🔧 How to Change Things

Simple, step-by-step instructions for making common changes to the project.

---

## 🎨 Change Colors / Fonts / Styling

**File to edit:** `app/src/app/globals.css`

This single file controls ALL visual styles in the entire app. 

### Change the primary color (currently blue)
Look for `--color-primary` near the top of the file and change the hex value:
```css
--color-primary: #1E40AF;      /* Change this to any color */
--color-primary-hover: #1E3A8A; /* Make this slightly darker */
```

### Change fonts
Look for the `@import url(...)` line at the very top and swap to any Google Font:
```css
@import url('https://fonts.googleapis.com/css2?family=YOUR+FONT+NAME&display=swap');
```
Then update `font-family` in the `body` rule.

### Change card styles, button styles, etc.
Search for `.card`, `.btn-primary`, `.sidebar`, etc. in the same file. Every component's style is there.

---

## 📊 Add a New Dashboard Page

1. Create a new folder inside `app/src/app/dashboard/`:
   ```
   app/src/app/dashboard/my-new-page/page.tsx
   ```

2. Write your page component:
   ```tsx
   "use client";
   export default function MyNewPage() {
     return <div className="page-container"><h1>My New Page</h1></div>;
   }
   ```

3. Add a link in the sidebar — edit `app/src/app/dashboard/layout.tsx`:
   Find the navigation links and add yours:
   ```tsx
   <Link href="/dashboard/my-new-page">My New Page</Link>
   ```

---

## 🔌 Add a New API Endpoint

1. Create a new folder inside `app/src/app/api/`:
   ```
   app/src/app/api/my-endpoint/route.ts
   ```

2. Export the HTTP methods you need:
   ```typescript
   import { NextResponse } from "next/server";
   
   export async function GET() {
     return NextResponse.json({ message: "Hello!" });
   }
   
   export async function POST(request: Request) {
     const body = await request.json();
     return NextResponse.json({ received: body });
   }
   ```

3. Access it at: `http://localhost:3000/api/my-endpoint`

---

## 🗄️ Add a New Database Table

1. Open `app/prisma/schema.prisma`

2. Add your new model at the bottom:
   ```prisma
   model MyNewTable {
     id        String   @id @default(uuid()) @db.Uuid
     name      String
     createdAt DateTime @default(now()) @map("created_at")
     
     @@map("my_new_table")
   }
   ```

3. Run these commands:
   ```bash
   cd app
   npx prisma db push      # Push changes to the database
   npx prisma generate      # Regenerate the Prisma client
   ```

4. Now you can use it in any API route:
   ```typescript
   import prisma from "@/lib/prisma";
   const items = await prisma.myNewTable.findMany();
   ```

---

## 🤖 Change the AI Model

**File to edit:** `app/src/lib/ai-service.ts`

### Switch to a different Hugging Face model
Find the line that says:
```typescript
model: "meta-llama/Llama-3.1-8B-Instruct"
```
Change it to any model from huggingface.co, for example:
```typescript
model: "mistralai/Mistral-7B-Instruct-v0.3"
```

### Change how the AI classifies reviews
Find the `SYSTEM_PROMPT` variable. This is the instruction we give to the AI. You can modify it to change how it categorizes things:
```typescript
const SYSTEM_PROMPT = `You are a sentiment analysis expert...`
```

### Change the AI provider entirely
Go to `app/src/app/dashboard/settings/page.tsx` in the browser. The Settings page lets users switch between:
- **HuggingFace** (free, uses Llama 3.1)
- **OpenAI** (paid, uses GPT-4o-mini)
- **Google Gemini** (paid, uses Gemini 2.5 Flash)

---

## 🔐 Change Authentication Settings

**File to edit:** `app/src/app/layout.tsx`

The Clerk provider is configured here. If you need to change allowed redirect URLs:
```tsx
<ClerkProvider allowedRedirectOrigins={["http://localhost:3000"]}>
```

To manage users, go to your Clerk dashboard at: https://dashboard.clerk.com

---

## 📝 Change the Landing Page

**File to edit:** `app/src/app/page.tsx`

This file contains the entire landing page — the hero section, feature cards, and call-to-action buttons. Just edit the JSX directly.

---

## 🚀 Deploy to Production

The app is configured for **Netlify** deployment.

1. Push your code to GitHub
2. Connect the GitHub repo to Netlify
3. Set environment variables in Netlify's dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `HF_API_KEY`
4. Deploy! Netlify will automatically run `npx prisma generate && npm run build`

---

## 📦 Install a New Package

```bash
cd app
npm install package-name
```

The package will be added to `package.json` automatically.

---

## 🐛 Common Issues & Fixes

### "Cannot find module '@prisma/client'"
```bash
cd app
npx prisma generate
```

### "ECONNREFUSED" or database connection error
Check that `DATABASE_URL` in `.env.local` is correct and your Supabase project is running.

### Reviews showing as "Neutral" with 0% confidence
This means the AI API call failed (usually rate limiting). Wait a few minutes and re-upload, or switch to a different AI provider in Settings.

### "Clerk: publishable key is missing"
Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local`.
