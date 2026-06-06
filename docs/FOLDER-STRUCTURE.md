# 📁 Folder & File Structure

Every single folder and file in this project, explained in plain English.

---

## Root Level (`senti insights/`)

```
senti insights/
├── .agents/              ← AI agent skill configurations (ignore this)
├── app/                  ← ⭐ THE MAIN APPLICATION (everything important is here)
├── design-system/        ← Design reference document (CSS color palettes, fonts, etc.)
├── docs/                 ← 📖 You are here! Project documentation
├── ui-ux-pro-max-skill/  ← AI design skill data (ignore this)
└── netlify.toml          ← Deployment configuration for Netlify hosting
```

> **Key Takeaway:** The only folder you need to care about is `app/`. Everything else is either documentation or tooling.

---

## The App Folder (`app/`)

```
app/
├── .env.local            ← 🔐 Secret keys (database URL, API keys) — NEVER share this
├── .gitignore            ← Tells Git which files to ignore
├── package.json          ← Lists all dependencies and scripts
├── package-lock.json     ← Locks exact dependency versions
├── tsconfig.json         ← TypeScript configuration
├── next.config.ts        ← Next.js configuration
├── netlify.toml          ← Netlify deployment settings
├── eslint.config.mjs     ← Code linting rules
├── prisma.config.ts      ← Prisma ORM configuration
├── prisma/               ← Database schema folder
│   └── schema.prisma     ← ⭐ THE DATABASE BLUEPRINT (defines all tables)
├── public/               ← Static files (SVG icons served directly)
├── node_modules/         ← Installed packages (auto-generated, never edit)
├── .next/                ← Build output (auto-generated, never edit)
└── src/                  ← ⭐ ALL SOURCE CODE LIVES HERE
```

---

## The Source Code (`app/src/`)

```
src/
├── app/                  ← All pages and API routes (Next.js App Router)
└── lib/                  ← Shared utility functions and services
```

---

## Pages & Layouts (`app/src/app/`)

```
src/app/
├── layout.tsx            ← 🏗️ ROOT LAYOUT — wraps the entire app
│                            (loads fonts, sets up Clerk auth provider)
├── page.tsx              ← 🏠 LANDING PAGE — what visitors see at "/"
│                            (hero section, feature cards, CTA buttons)
├── globals.css           ← 🎨 ALL CSS STYLES — every visual style in the app
│                            (colors, fonts, cards, buttons, animations)
├── favicon.ico           ← Browser tab icon
├── sign-in/              ← Clerk sign-in page
├── sign-up/              ← Clerk sign-up page
├── dashboard/            ← ⭐ THE MAIN DASHBOARD (protected, requires login)
└── api/                  ← ⭐ ALL BACKEND API ROUTES
```

---

## Dashboard Pages (`app/src/app/dashboard/`)

These are the pages users see after logging in.

```
dashboard/
├── layout.tsx            ← 🏗️ DASHBOARD LAYOUT — the sidebar navigation
│                            (appears on every dashboard page)
├── page.tsx              ← 📊 OVERVIEW PAGE — KPI cards, recent reviews
├── dashboard-client.tsx  ← 📊 CLIENT COMPONENT — charts, sentiment graph
│
├── analytics/
│   └── page.tsx          ← 📈 ANALYTICS PAGE — detailed charts, sentiment
│                            timeline, category breakdown, trend analysis
├── reviews/
│   └── page.tsx          ← 📝 REVIEWS PAGE — list all reviews with filters
│                            (filter by sentiment, category, search, delete)
├── complaints/
│   └── page.tsx          ← 🚨 COMPLAINTS PAGE — auto-flagged negative reviews
│                            (resolve tickets, add notes, track status)
├── upload/
│   └── page.tsx          ← ⬆️ UPLOAD PAGE — upload CSV files or paste reviews
│                            (shows progress bar, ETA, AI processing status)
├── insights/
│   └── page.tsx          ← 🧠 INSIGHTS PAGE — AI-generated summary report
│                            (key issues, positive highlights, recommendations)
└── settings/
    └── page.tsx          ← ⚙️ SETTINGS PAGE — configure AI providers, API keys
                             (choose between HuggingFace, OpenAI, Gemini)
```

---

## API Routes (`app/src/app/api/`)

These are the backend endpoints. When the frontend needs data, it calls these.

```
api/
├── analytics/
│   ├── route.ts          ← GET /api/analytics
│   │                        Returns: total reviews, sentiment percentages,
│   │                        trend data, top categories
│   └── ai-categories/
│       └── route.ts      ← POST /api/analytics/ai-categories
│                            Uses AI to generate smart category groupings
│                            from all the reviews in a workspace
│
├── analyze/
│   └── route.ts          ← POST /api/analyze
│                            Analyzes a SINGLE review using AI
│                            Input: review text → Output: sentiment + category
│
├── reviews/
│   ├── route.ts          ← GET /api/reviews — fetch all reviews with filters
│   │                        DELETE /api/reviews — delete single or all reviews
│   ├── upload/
│   │   └── route.ts      ← POST /api/reviews/upload
│   │                        Handles bulk CSV upload and AI processing
│   │                        Processes reviews in batches to avoid rate limits
│   ├── categories/
│   │   └── route.ts      ← GET /api/reviews/categories
│   │                        Returns list of unique categories from database
│   └── [id]/
│       └── resolve/
│           └── route.ts  ← PATCH /api/reviews/[id]/resolve
│                            Updates complaint status (Open → Resolved)
│
├── insights/
│   └── generate/
│       └── route.ts      ← POST /api/insights/generate
│                            Asks AI to write a summary report of all reviews
│
└── settings/
    └── route.ts          ← GET + PUT /api/settings
                             Read and update workspace settings (API keys, providers)
```

---

## Shared Libraries (`app/src/lib/`)

These are helper files used by multiple pages and API routes.

```
lib/
├── ai-service.ts         ← 🧠 THE AI ENGINE
│                            Contains all AI provider code:
│                            - HuggingFace (Llama 3.1)
│                            - Google Gemini
│                            - OpenAI (GPT-4o-mini)
│                            Handles: prompt construction, API calls,
│                            response parsing, retry logic, rate limiting
│
├── auth.ts               ← 🔐 AUTHENTICATION HELPER
│                            Gets the current logged-in user from Clerk
│                            Finds or creates their workspace in the database
│
├── prisma.ts             ← 🗄️ DATABASE CONNECTION
│                            Creates a single shared Prisma client instance
│                            (prevents creating too many database connections)
│
└── utils.ts              ← 🔧 UTILITY FUNCTIONS
                             - cn() — combines CSS class names
                             - formatDate() — makes dates readable
                             - formatPercent() — formats numbers as percentages
                             - getSentimentColor() — returns color for sentiment
                             - getStatusColor() — returns color for complaint status
                             - truncate() — shortens long text with "..."
                             - parseCSVReviews() — reads CSV text into objects
```

---

## Database Schema (`app/prisma/schema.prisma`)

This file defines all the database tables. See **DATABASE-EXPLAINED.md** for full details.

---

## Public Assets (`app/public/`)

```
public/
├── file.svg              ← File icon (Next.js default)
├── globe.svg             ← Globe icon (Next.js default)
├── next.svg              ← Next.js logo
├── vercel.svg            ← Vercel logo
└── window.svg            ← Window icon (Next.js default)
```
