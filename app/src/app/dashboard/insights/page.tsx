"use client";

import { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, Loader2, AlertCircle, TrendingUp, CheckCircle, Lightbulb } from "lucide-react";

interface InsightData {
  id: string;
  summary: string;
  keyIssues: string[];
  positiveHighlights: string[];
  recommendations: string[];
  generatedAt: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights/generate", { method: "GET" });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = "AI Insights — Sentiment Insights Hub"; }, []);

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/generate", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.insight) {
        setInsights(prev => [data.insight, ...prev]);
      } else {
        setError(data.error || "Failed to generate insights.");
      }
    } catch {
      setError("Network error occurred while generating insights.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="kpi-grid">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>;
  }

  const latest = insights[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>AI Executive Insights</h2>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, marginTop: 4 }}>
            Actionable intelligence synthesized from your latest customer feedback.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {generating ? "Synthesizing..." : "Generate Fresh Insights"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "14px 20px", borderRadius: "var(--radius)", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          <AlertCircle size={18} />
          <span style={{ fontWeight: 500, fontSize: 14 }}>{error}</span>
        </div>
      )}

      {!latest ? (
        <div className="empty-state" style={{ padding: 60 }}>
          <BrainCircuit size={48} style={{ color: "var(--color-muted-foreground)", marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No AI Insights Generated Yet</h3>
          <p style={{ color: "var(--color-muted-foreground)", fontSize: 14, maxWidth: 400 }}>
            Ensure you have configured your LLM Provider and API Key in Settings, then click generate to analyze your reviews.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {}
          <div className="card" style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0" }}>
            <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
                <BrainCircuit size={18} />
                Executive Summary
              </span>
              <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                {new Date(latest.generatedAt).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, padding: 20, color: "var(--color-foreground)" }}>
              {latest.summary}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "#059669" }}>
                  <CheckCircle size={16} />
                  What Customers Love
                </span>
              </div>
              <ul style={{ padding: "0 20px 20px 20px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {latest.positiveHighlights.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5, color: "var(--color-muted-foreground)" }}>
                    <span style={{ color: "#10B981" }}>•</span> {item}
                  </li>
                ))}
                {latest.positiveHighlights.length === 0 && <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>No data available.</span>}
              </ul>
            </div>

            {}
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626" }}>
                  <TrendingUp size={16} style={{ transform: "scaleY(-1)" }} />
                  Major Complaint Trends
                </span>
              </div>
              <ul style={{ padding: "0 20px 20px 20px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {latest.keyIssues.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5, color: "var(--color-muted-foreground)" }}>
                    <span style={{ color: "#EF4444" }}>•</span> {item}
                  </li>
                ))}
                {latest.keyIssues.length === 0 && <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>No data available.</span>}
              </ul>
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "#D97706" }}>
                <Lightbulb size={16} />
                Actionable Recommendations
              </span>
            </div>
            <ul style={{ padding: "0 20px 20px 20px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
              {latest.recommendations.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
                  <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                    {i + 1}
                  </div>
                  <span style={{ color: "var(--color-foreground)", marginTop: 2 }}>{item}</span>
                </li>
              ))}
              {latest.recommendations.length === 0 && <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>No recommendations available.</span>}
            </ul>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
