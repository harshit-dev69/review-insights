

export interface AiPrediction {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  category: string;
}

export type SentimentProvider = "huggingface" | "gemini" | "openai";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 503) {
      
      console.log(`Model loading... waiting 10s (attempt ${attempt + 1}/${retries + 1})`);
      await delay(10000);
      continue;
    }
    if (res.status === 429) {
      
      console.log(`Rate limited... waiting 5s (attempt ${attempt + 1}/${retries + 1})`);
      await delay(5000);
      continue;
    }
    return res;
  }
  
  return fetch(url, options);
}

function normalizeSentimentLabel(label: string): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  const l = label.toLowerCase().trim();

  
  if (l === "positive") return "POSITIVE";
  if (l === "negative") return "NEGATIVE";
  if (l === "neutral") return "NEUTRAL";

  
  if (l.includes("positive") || l.includes("pos")) return "POSITIVE";
  if (l.includes("negative") || l.includes("neg")) return "NEGATIVE";
  if (l.includes("neutral") || l.includes("neu") || l.includes("mixed")) return "NEUTRAL";

  
  if (l === "label_0") return "NEGATIVE";
  if (l === "label_1") return "NEUTRAL";
  if (l === "label_2") return "POSITIVE";

  
  if (l.includes("1 star") || l.includes("2 star")) return "NEGATIVE";
  if (l.includes("3 star")) return "NEUTRAL";
  if (l.includes("4 star") || l.includes("5 star")) return "POSITIVE";

  
  console.warn(`Unknown sentiment label: "${label}" — defaulting to NEUTRAL`);
  return "NEUTRAL";
}

const DYNAMIC_CANDIDATE_LABELS = [
  "Product Quality", "Customer Service", "Pricing", "Performance",
  "Delivery", "User Experience", "Battery Life", "Build Quality",
  "Software", "Hardware", "Support", "Value for Money",
  "Design", "Reliability", "Ease of Use", "Features",
  "Speed", "Durability", "Compatibility", "Other"
];

async function analyzeWithHuggingFace(text: string, apiKey: string): Promise<AiPrediction> {
  const prompt = `You are an expert human sentiment analyzer. Analyze this customer review and return ONLY a JSON object.

Rules for sentiment:
- "POSITIVE": The user is happy, satisfied, praising, or expressing a positive experience. Even minor complaints surrounded by overall praise are POSITIVE.
- "NEGATIVE": The user is unhappy, complaining, frustrated, or expressing issues/defects. Even minor praise surrounded by overall complaints is NEGATIVE.
- "NEUTRAL": The user is simply asking a question, making a factual statement, or is completely ambivalent. Most reviews lean one way or another, so only use NEUTRAL when there is truly no sentiment.

Rules for category:
- Pick a concise 1-3 word category describing the main topic (e.g., "Battery Life", "Customer Support", "Software Bugs", "Pricing").
- Be specific to the actual issue/topic. Avoid generic categories like "General".

EXAMPLES:
Review: "The app keeps crashing when I open the dashboard. The colors are nice though."
{"sentiment": "NEGATIVE", "confidence": 95, "category": "App Stability"}

Review: "I absolutely love how fast the delivery was! The box was slightly dented but the product is perfect."
{"sentiment": "POSITIVE", "confidence": 98, "category": "Delivery Speed"}

Review: "Does this device support 220V power outlets?"
{"sentiment": "NEUTRAL", "confidence": 90, "category": "Product Specs"}

Output exactly this JSON format:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "confidence": <number 0-100>,
  "category": "<string>"
}

Review: "${text.replace(/"/g, '\\"')}"`;

  const res = await fetchWithRetry(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HuggingFace Llama-3 API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const jsonStr = data.choices?.[0]?.message?.content;
  if (!jsonStr) throw new Error("Empty HuggingFace response");

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error("Failed to parse JSON from HuggingFace");
  }

  const sentiment = (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(parsed.sentiment?.toUpperCase()))
    ? parsed.sentiment.toUpperCase() as "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    : "NEUTRAL";

  return {
    sentiment,
    confidence: Math.min(100, Math.max(0, parseFloat(parsed.confidence) || 50)),
    category: parsed.category || "Other",
  };
}

async function analyzeWithGemini(text: string, apiKey: string): Promise<AiPrediction> {
  const prompt = `You are an expert human sentiment analyzer. Analyze this customer review and return ONLY a JSON object.

Rules for sentiment:
- "POSITIVE": The user is happy, satisfied, praising, or expressing a positive experience. Even minor complaints surrounded by overall praise are POSITIVE.
- "NEGATIVE": The user is unhappy, complaining, frustrated, or expressing issues/defects. Even minor praise surrounded by overall complaints is NEGATIVE.
- "NEUTRAL": The user is simply asking a question, making a factual statement, or is completely ambivalent. Most reviews lean one way or another, so only use NEUTRAL when there is truly no sentiment.

Rules for category:
- Pick a concise 1-3 word category describing the main topic (e.g., "Battery Life", "Customer Support", "Software Bugs", "Pricing").
- Be specific to the actual issue/topic. Avoid generic categories like "General".

EXAMPLES:
Review: "The app keeps crashing when I open the dashboard. The colors are nice though."
{"sentiment": "NEGATIVE", "confidence": 95, "category": "App Stability"}

Review: "I absolutely love how fast the delivery was! The box was slightly dented but the product is perfect."
{"sentiment": "POSITIVE", "confidence": 98, "category": "Delivery Speed"}

Review: "Does this device support 220V power outlets?"
{"sentiment": "NEUTRAL", "confidence": 90, "category": "Product Specs"}

Output exactly this JSON format:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "confidence": <number 0-100>,
  "category": "<string>"
}

Review: "${text.replace(/"/g, '\\"')}"`;

  const res = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonStr) throw new Error("Empty Gemini response");

  const parsed = JSON.parse(jsonStr);
  const sentiment = (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(parsed.sentiment?.toUpperCase()))
    ? parsed.sentiment.toUpperCase() as "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    : "NEUTRAL";

  return {
    sentiment,
    confidence: Math.min(100, Math.max(0, parseFloat(parsed.confidence) || 50)),
    category: parsed.category || "Other",
  };
}

async function analyzeWithOpenAI(text: string, apiKey: string): Promise<AiPrediction> {
  const prompt = `You are an expert human sentiment analyzer. Analyze this customer review and return ONLY a JSON object.

Rules for sentiment:
- "POSITIVE": The user is happy, satisfied, praising, or expressing a positive experience. Even minor complaints surrounded by overall praise are POSITIVE.
- "NEGATIVE": The user is unhappy, complaining, frustrated, or expressing issues/defects. Even minor praise surrounded by overall complaints is NEGATIVE.
- "NEUTRAL": The user is simply asking a question, making a factual statement, or is completely ambivalent. Most reviews lean one way or another, so only use NEUTRAL when there is truly no sentiment.

Rules for category:
- Pick a concise 1-3 word category describing the main topic (e.g., "Battery Life", "Customer Support", "Software Bugs", "Pricing").
- Be specific to the actual issue/topic. Avoid generic categories like "General".

Output exactly this JSON format:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "confidence": <number 0-100>,
  "category": "<string>"
}

Review: "${text.replace(/"/g, '\\"')}"`;

  const res = await fetchWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const jsonStr = data.choices?.[0]?.message?.content;
  if (!jsonStr) throw new Error("Empty OpenAI response");

  const parsed = JSON.parse(jsonStr);
  const sentiment = (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(parsed.sentiment?.toUpperCase()))
    ? parsed.sentiment.toUpperCase() as "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    : "NEUTRAL";

  return {
    sentiment,
    confidence: Math.min(100, Math.max(0, parseFloat(parsed.confidence) || 50)),
    category: parsed.category || "Other",
  };
}

export async function analyzeReview(
  text: string,
  provider: SentimentProvider = "huggingface",
  apiKey?: string
): Promise<AiPrediction> {
  
  const resolvedKey = apiKey
    || (provider === "huggingface" ? process.env.HUGGINGFACE_API_KEY : undefined)
    || (provider === "gemini" ? process.env.GEMINI_API_KEY : undefined)
    || (provider === "openai" ? process.env.OPENAI_API_KEY : undefined);

  if (!resolvedKey) {
    throw new Error(`No API key available for provider "${provider}". Configure it in Settings.`);
  }

  switch (provider) {
    case "huggingface":
      return analyzeWithHuggingFace(text, resolvedKey);
    case "gemini":
      return analyzeWithGemini(text, resolvedKey);
    case "openai":
      return analyzeWithOpenAI(text, resolvedKey);
    default:
      throw new Error(`Unknown sentiment provider: ${provider}`);
  }
}

export async function analyzeReviewsBatch(
  texts: string[],
  provider: SentimentProvider = "huggingface",
  apiKey?: string
): Promise<AiPrediction[]> {
  const BATCH_SIZE = provider === "huggingface" ? 2 : 5; 
  const BATCH_DELAY = provider === "huggingface" ? 1500 : 300;
  const results: AiPrediction[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        try {
          return await analyzeReview(text, provider, apiKey);
        } catch (err) {
          console.warn("Review analysis failed (rate limit/timeout), falling back:", err);
          
          return { sentiment: "NEUTRAL", confidence: 0, category: "Uncategorized" } as AiPrediction;
        }
      })
    );
    results.push(...batchResults);

    
    if (i + BATCH_SIZE < texts.length) {
      await delay(BATCH_DELAY);
    }
  }

  return results;
}
