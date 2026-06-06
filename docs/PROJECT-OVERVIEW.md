# 🚀 Project Overview

## What Is This Project?

**Sentiment Insights Hub** is a web application that helps businesses understand what their customers are saying. 

Imagine you run a restaurant and you have 1,000 Google reviews. Reading all of them manually would take days. This app does it for you in **minutes** using Artificial Intelligence.

---

## What Problem Does It Solve?

| Without This App | With This App |
|-----------------|---------------|
| You read reviews one by one | AI reads ALL reviews instantly |
| You guess if feedback is good or bad | AI tells you: Positive, Negative, or Neutral |
| You don't know which problems are common | AI groups reviews into categories like "Delivery Speed" or "App Crashes" |
| Complaints get lost | Negative reviews automatically become support tickets |

---

## The Tech Stack (Technologies Used)

### Frontend (What the user sees)
| Technology | What It Does | Why We Chose It |
|-----------|-------------|-----------------|
| **Next.js 16** | The main framework that builds our website | It's the most popular React framework in the industry. It handles both the website pages AND the backend API in one project |
| **React 19** | The library that makes the UI interactive | Industry standard for building modern web interfaces |
| **Vanilla CSS** | Styles and makes the app look beautiful | Maximum control over the design without extra dependencies |
| **Recharts** | Creates the graphs and charts on the dashboard | Easy-to-use charting library built specifically for React |
| **Lucide React** | Provides all the icons (arrows, settings gear, etc.) | Clean, modern icon library |
| **Framer Motion** | Adds smooth animations | Makes the UI feel premium and alive |

### Backend (Behind the scenes)
| Technology | What It Does | Why We Chose It |
|-----------|-------------|-----------------|
| **Next.js API Routes** | Handles all server-side logic (saving reviews, calling AI, etc.) | Built into Next.js — no need for a separate backend server |
| **Prisma ORM** | Talks to the database using TypeScript instead of raw SQL | Makes database operations type-safe and easy to write |
| **PostgreSQL** | The actual database where all data is stored | Powerful, reliable, open-source database |
| **Supabase** | Hosts our PostgreSQL database in the cloud | Free tier, easy setup, great dashboard |

### Authentication (Login System)
| Technology | What It Does | Why We Chose It |
|-----------|-------------|-----------------|
| **Clerk** | Handles sign-up, sign-in, user sessions, and security | Production-ready auth in minutes — no need to build login from scratch |

### AI / Machine Learning
| Technology | What It Does | Why We Chose It |
|-----------|-------------|-----------------|
| **Hugging Face API** | Provides access to AI models (Llama 3.1) | Free tier available, hosts thousands of open-source AI models |
| **Llama 3.1 (8B Instruct)** | The actual AI model that reads and classifies reviews | One of the best open-source language models, created by Meta |
| **Few-Shot Prompting** | Technique where we give the AI examples to learn from | Makes the AI much more accurate at classifying sentiments |

### Other Tools
| Technology | What It Does |
|-----------|-------------|
| **PapaParse** | Reads and parses CSV files that users upload |
| **Zustand** | Manages shared state across React components |
| **TanStack Query** | Handles data fetching, caching, and synchronization |
| **react-hot-toast** | Shows success/error notification popups |
| **date-fns** | Formats dates in a human-readable way |

---

## How to Run the Project

```bash
# 1. Go to the app folder
cd app

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Start the development server
npm run dev

# 5. Open in browser
# Go to http://localhost:3000
```

---

## Environment Variables Needed

The app needs these secret keys to work (stored in `app/.env.local`):

| Variable | What It's For |
|----------|--------------|
| `DATABASE_URL` | Connection string to your Supabase PostgreSQL database |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's public key (safe to expose) |
| `CLERK_SECRET_KEY` | Clerk's secret key (never expose this!) |
| `HF_API_KEY` | Your Hugging Face API token for AI features |
