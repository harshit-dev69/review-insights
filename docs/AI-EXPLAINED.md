# 🧠 AI Sentiment Analysis (In Simple Terms)

This document explains how the "AI brain" of our application works. It covers how reviews are analyzed, the different AI models we support, and how the app handles rate limits safely.

---

## 🔍 How a Review is Analyzed

When you upload a review like *"The app is slow but customer service was very helpful"*, the app doesn't just scan for words like "slow" or "helpful". It uses a Large Language Model (LLM) to read the sentence exactly like a human would.

Here is the 3-step process:

### 1. Building the Prompt (The Instructions)
The application wraps your review inside a set of strict guidelines. This is called **Prompt Engineering**. The instructions tell the AI:
*   How to define **Positive** (satisfied/happy), **Negative** (frustrated/complaining), and **Neutral** (factual/no clear emotion).
*   To assign a **Confidence Score** from 0 to 100 representing how sure it is.
*   To choose a **1-to-3 word category** describing the topic (e.g. "Customer Support").
*   To return the output in a clean, computer-readable **JSON format** (not a long conversational paragraph).

### 2. Few-Shot Prompting (Teaching by Example)
To ensure the AI is consistent and doesn't hallucinate, we use **Few-Shot Prompting**. This means we show the AI a few examples of input and expected output before giving it the real review:
*   *Example 1:* "The app keeps crashing" $\rightarrow$ `{"sentiment": "NEGATIVE", "confidence": 95, "category": "App Stability"}`
*   *Example 2:* "I absolutely love how fast delivery was!" $\rightarrow$ `{"sentiment": "POSITIVE", "confidence": 98, "category": "Delivery Speed"}`

### 3. Running the Model and Parsing the Answer
The prompt is sent to the AI API. The AI responds with the JSON object, which is then unpacked and saved directly into the database.

---

## ⚡ Supported AI Providers

You can configure which AI provider to use on the **Settings** page. Here is a comparison of the three options:

| Provider | Default Model | Speed | Cost | Description |
|----------|---------------|-------|------|-------------|
| **Hugging Face** *(Default)* | `meta-llama/Llama-3.1-8B-Instruct` | Moderate | **Free** | Hosted open-source model. Excellent for starting out, but has lower rate limits. |
| **OpenAI** | `gpt-4o-mini` | Very Fast | Low (Paid) | Fast, highly accurate, and extremely reliable. Requires an OpenAI API key. |
| **Google Gemini** | `gemini-2.5-flash` | Very Fast | Low (Paid) | Gemini's fast flash model. Excellent reasoning capabilities and very cost-effective. Requires a Google AI key. |

---

## 🛡️ Reliability & Handling Limits (How We Avoid Crashes)

AI API providers limit how many requests you can make in a minute (Rate Limits). If you upload a CSV file with 500 reviews and try to send them all at once, the APIs will block us. 

To prevent this, the code implements three safety mechanisms:

### 1. Batching & Delays
Instead of sending 500 reviews simultaneously:
*   **Hugging Face:** The app processes reviews in batches of **2** at a time, waiting **1.5 seconds** between each batch.
*   **OpenAI & Gemini:** The app processes in batches of **5** at a time, waiting **0.3 seconds** between each batch.

### 2. Auto-Retries
If an API returns a busy code:
*   **Status 503 (Model Loading):** If the Hugging Face model is sleeping/starting up, the app prints a warning, waits **10 seconds**, and tries again.
*   **Status 429 (Rate Limited):** If we hit a rate limit, the app waits **5 seconds** and tries again.
It will retry up to **2 times** before giving up on a specific review.

### 3. Safe Failbacks (No Crashes)
If a review fails to analyze after all retries (e.g. if your internet drops or you ran out of API credits), the app **does not crash or stop uploading**. 
Instead, it saves a safe fallback result in the database:
*   **Sentiment:** `NEUTRAL`
*   **Confidence:** `0%`
*   **Category:** `Uncategorized`

This ensures that your CSV import finishes successfully even if the AI provider has a temporary hiccup.
