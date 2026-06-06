"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user } = useUser();

  useEffect(() => { document.title = "Settings — Sentiment Insights Hub"; }, []);

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Account Settings</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" defaultValue={user?.fullName || ""} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" defaultValue={user?.emailAddresses?.[0]?.emailAddress || ""} readOnly />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Platform</span></div>
        <p style={{ fontSize: 14, color: "var(--color-muted-foreground)" }}>
          Sentiment Insights Hub AI v1.0 — Manage your account via the avatar menu in the top right.
        </p>
      </div>

      <AIProviderSettings />
    </div>
  );
}

function AIProviderSettings() {
  
  const [sentimentProvider, setSentimentProvider] = useState("huggingface");
  const [hfApiKey, setHfApiKey] = useState("");

  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.sentimentProvider) setSentimentProvider(data.sentimentProvider);
      if (data.hfApiKey) setHfApiKey(data.hfApiKey);
      if (data.llmProvider) setLlmProvider(data.llmProvider);
      if (data.llmApiKey) setLlmApiKey(data.llmApiKey);
    }).finally(() => setLoading(false));
  }, []);

  
  const sentimentKeyValue = sentimentProvider === "huggingface" ? hfApiKey : llmApiKey;
  const sentimentKeyPlaceholder = sentimentProvider === "huggingface" ? "hf_..." : sentimentProvider === "gemini" ? "AIza..." : "sk-...";

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentimentProvider,
          hfApiKey,
          llmProvider,
          llmApiKey,
        })
      });
      if (res.ok) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to save settings.", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error occurred.", type: "error" });
    }
    setSaving(false);
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {}
      <div className="card">
        <div className="card-header"><span className="card-title">Sentiment Analysis Provider</span></div>
        <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginBottom: 16 }}>
          Choose the AI provider for classifying review sentiment (Positive / Negative / Neutral) and categorization during upload.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <select className="form-input" value={sentimentProvider} onChange={(e) => setSentimentProvider(e.target.value)}>
              <option value="huggingface">HuggingFace (Free)</option>
              <option value="gemini">Google Gemini (Free Tier)</option>
              <option value="openai">OpenAI GPT (Paid)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {sentimentProvider === "huggingface" ? "HuggingFace Access Token" : sentimentProvider === "gemini" ? "Gemini API Key" : "OpenAI API Key"}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder={sentimentKeyPlaceholder}
              value={sentimentKeyValue}
              onChange={(e) => {
                if (sentimentProvider === "huggingface") setHfApiKey(e.target.value);
                else setLlmApiKey(e.target.value);
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-muted)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--color-muted-foreground)" }}>
          {sentimentProvider === "huggingface" && "🟢 Free — Uses cardiffnlp/twitter-roberta-base for sentiment + facebook/bart-large-mnli for categories. No billing required."}
          {sentimentProvider === "gemini" && "🟡 Free Tier — Uses Gemini 2.5 Flash for both sentiment + category in a single call. Generous free quota."}
          {sentimentProvider === "openai" && "🔴 Paid — Uses GPT-4o-mini for sentiment + category. Small cost per review."}
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header"><span className="card-title">AI Insights Provider</span></div>
        <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginBottom: 16 }}>
          Choose the LLM for generating executive summaries and actionable business recommendations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">LLM Provider</label>
            <select className="form-input" value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)}>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="gemini">Google Gemini</option>
              <option value="huggingface">Hugging Face</option>
              <option value="others">Others</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {llmProvider === "gemini" ? "Gemini API Key" : llmProvider === "huggingface" ? "Hugging Face API Key" : llmProvider === "others" ? "API Key (Other)" : "OpenAI API Key"}
            </label>
            <input
              type="password"
              className="form-input"
              placeholder={llmProvider === "openai" ? "sk-..." : llmProvider === "gemini" ? "AIza..." : llmProvider === "huggingface" ? "hf_..." : "api_key..."}
              value={llmApiKey}
              onChange={(e) => setLlmApiKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      {}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16 }}>
        {message && (
          <span style={{ fontSize: 13, color: message.type === "success" ? "#059669" : "#DC2626" }}>
            {message.text}
          </span>
        )}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
