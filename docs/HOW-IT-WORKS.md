# ⚡ How the App Works (Step by Step)

This document walks you through the complete flow of the application — from the moment a user opens the website to seeing their AI-analyzed dashboard.

---

## Flow 1: User Signs Up / Logs In

```
User opens website → Lands on Landing Page (page.tsx)
        ↓
Clicks "Get Started" → Redirected to Clerk Sign-Up page
        ↓
Creates account (email + password) → Clerk creates a session
        ↓
Redirected to /dashboard → Dashboard layout.tsx checks auth
        ↓
auth.ts runs:
  1. Gets the Clerk user ID
  2. Checks if this user exists in OUR database
  3. If not → Creates a new User + Workspace in the database
  4. Returns the workspace ID
        ↓
Dashboard loads with empty state (no reviews yet)
```

---

## Flow 2: Uploading Reviews (CSV)

This is the core flow. Here's what happens when a user uploads a CSV file:

```
User goes to /dashboard/upload
        ↓
Drag-and-drops a CSV file (or pastes reviews manually)
        ↓
Frontend reads the CSV using PapaParse library
        ↓
Shows a preview table of the parsed reviews
        ↓
User clicks "Analyze Reviews"
        ↓
Frontend sends reviews to POST /api/reviews/upload in batches
        ↓
For EACH batch, the API does:
  ┌─────────────────────────────────────────────────┐
  │ 1. Save raw reviews to the "reviews" table       │
  │ 2. Call AI service (ai-service.ts) for each review│
  │    → Sends review text to Hugging Face API        │
  │    → AI returns: sentiment + confidence + category│
  │ 3. Save AI results to the "ai_analysis" table     │
  │ 4. If sentiment = NEGATIVE:                       │
  │    → Auto-create a Complaint ticket               │
  └─────────────────────────────────────────────────┘
        ↓
Frontend shows real-time progress bar + ETA countdown
        ↓
When all batches complete → User is redirected to Dashboard
```

---

## Flow 3: How AI Analysis Works (Single Review)

When the AI receives a single review like *"The delivery was very late and the food was cold"*:

```
Review text enters ai-service.ts
        ↓
System builds a PROMPT (a message to the AI):
  "You are a sentiment analysis expert.
   Classify this review as POSITIVE, NEGATIVE, or NEUTRAL.
   Give a confidence score from 0 to 100.
   Assign a short category (1-3 words).
   
   Here are examples:
   - 'Great food!' → POSITIVE, 95, Food Quality
   - 'Terrible service' → NEGATIVE, 92, Customer Service
   
   Now analyze: 'The delivery was very late and the food was cold'"
        ↓
Sends this prompt to Hugging Face API (Llama 3.1 model)
        ↓
AI responds with JSON:
  {
    "sentiment": "NEGATIVE",
    "confidence": 88,
    "category": "Delivery Speed"
  }
        ↓
System saves this to the ai_analysis table in the database
        ↓
Since sentiment is NEGATIVE → also creates a Complaint ticket
```

---

## Flow 4: Viewing the Dashboard

When the user opens the dashboard:

```
Dashboard page.tsx loads
        ↓
Calls GET /api/analytics
        ↓
API queries the database:
  - Counts total reviews
  - Calculates % positive, % negative, % neutral
  - Groups reviews by date for the trend graph
  - Finds top categories
        ↓
Returns all this data as JSON
        ↓
Frontend renders:
  ┌──────────────────────────────────────┐
  │  KPI Cards (Total, Positive %, etc.) │
  │  Sentiment Distribution Pie Chart    │
  │  Trend Line Graph (over time)        │
  │  Recent Reviews List                 │
  └──────────────────────────────────────┘
```

---

## Flow 5: Complaint Management

```
User goes to /dashboard/complaints
        ↓
Page fetches all complaints (auto-created from negative reviews)
        ↓
Each complaint shows:
  - The original review text
  - Severity (HIGH / MEDIUM / LOW)
  - Status (OPEN / IN_PROGRESS / RESOLVED)
        ↓
User can click "Resolve" on a complaint
        ↓
Calls PATCH /api/reviews/[id]/resolve
        ↓
Updates the complaint status to RESOLVED + saves timestamp
```

---

## Flow 6: AI Insights Generation

```
User goes to /dashboard/insights
        ↓
Clicks "Generate AI Insights"
        ↓
Calls POST /api/insights/generate
        ↓
API collects ALL reviews from the database
        ↓
Sends them to the AI with a prompt:
  "Analyze these 500 reviews and give me:
   1. A brief summary of overall sentiment
   2. Top 5 key issues customers mention
   3. Top 5 positive highlights
   4. Top 5 actionable recommendations"
        ↓
AI generates a comprehensive report
        ↓
Report is saved to the "insights" table
        ↓
Frontend displays the report with nice formatting
```

---

## Flow 7: Settings Configuration

```
User goes to /dashboard/settings
        ↓
Can change:
  - Sentiment AI Provider (HuggingFace / OpenAI / Gemini)
  - API Keys for each provider
  - Workspace name
        ↓
Clicks "Save"
        ↓
Calls PUT /api/settings
        ↓
Updates the workspace record in the database
        ↓
Next time reviews are analyzed, the new provider/key is used
```

---

## Summary: The Complete Data Flow

```
CSV File → PapaParse → Frontend → API Route → AI Service → Database
                                                    ↓
                                              Hugging Face API
                                              (Llama 3.1 Model)
                                                    ↓
                                              Returns Sentiment
                                                    ↓
                                              Saved to Database
                                                    ↓
                                         Dashboard reads from DB
                                                    ↓
                                         Charts + Graphs render
```
