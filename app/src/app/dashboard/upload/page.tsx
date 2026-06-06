"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Type, List, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

const AI_FACTS = [
  "Tip: Hugging Face models process millions of parameters in milliseconds.",
  "Did you know? The Transformer architecture was introduced by Google in 2017.",
  "Tip: High confidence scores (>80%) usually indicate a very unambiguous sentiment.",
  "Fact: AI sentiment models can now understand context and even sarcasm.",
  "Fact: 'RoBERTa' stands for Robustly Optimized BERT Pretraining Approach.",
  "Tip: Zero-shot classification categorizes text into classes it was never explicitly trained on.",
  "Fact: AI models convert words into numerical vectors to understand their relationships."
];

type TabType = "single" | "bulk" | "csv";

export default function UploadPage() {
  const [tab, setTab] = useState<TabType>("single");
  const [singleText, setSingleText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [csvData, setCsvData] = useState<Array<{ text: string; date?: string; rating?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentFact, setCurrentFact] = useState(AI_FACTS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "0s";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return `${m}m ${s}s`;
  };

  useEffect(() => { document.title = "Upload Reviews — Sentiment Insights Hub"; }, []);

  useEffect(() => {
    if (!loading) return;

    
    setCurrentFact(AI_FACTS[Math.floor(Math.random() * AI_FACTS.length)]);
    const factInterval = setInterval(() => {
      setCurrentFact(AI_FACTS[Math.floor(Math.random() * AI_FACTS.length)]);
    }, 3000);

    
    const countdownInterval = setInterval(() => {
      setEtaSeconds((prev) => {
        if (prev === null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(factInterval);
      clearInterval(countdownInterval);
    };
  }, [loading]);

  const handleUpload = async (reviews: Array<{ text: string; date?: string; rating?: string | number; source?: string }>) => {
    if (reviews.length === 0) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    
    setEtaSeconds(null);
    setElapsedSeconds(0);

    try {
      
      
      const BATCH_SIZE = reviews.length <= 10 ? 1 : reviews.length <= 50 ? 5 : 10;
      const totalBatches = Math.ceil(reviews.length / BATCH_SIZE);
      let successCount = 0;
      let currentBaseProgress = 0;
      const startTime = Date.now();

      
      const fakeInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 0.5, Math.round(currentBaseProgress + (100 / totalBatches) * 0.95)));
      }, 500);

      for (let i = 0; i < totalBatches; i++) {
        const batch = reviews.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

        const res = await fetch("/api/reviews/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews: batch }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        successCount += data.count || batch.length;

        currentBaseProgress = Math.round(((i + 1) / totalBatches) * 100);
        setProgress(currentBaseProgress);

        const elapsed = Date.now() - startTime;
        const avgTimePerBatch = elapsed / (i + 1);
        const remainingBatches = totalBatches - (i + 1);

        if (remainingBatches > 0) {
          setEtaSeconds(Math.round((remainingBatches * avgTimePerBatch) / 1000));
        } else {
          setEtaSeconds(0);
        }
      }

      clearInterval(fakeInterval);
      setProgress(100);

      const finalTime = Math.round((Date.now() - startTime) / 1000);
      setResult({ success: true, message: `${successCount} reviews processed in exactly ${formatTime(finalTime)}!` });
      setSingleText("");
      setBulkText("");
      setCsvData([]);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Network error. Please try again." });
    } finally {
      setLoading(false);
      setEtaSeconds(null);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleCSVParse = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      const parsed = json
        .filter((row) => row.review || row.text || row.Review || row.Text || Object.values(row)[0])
        .map((row) => {
          const textVal = row.review || row.text || row.Review || row.Text || Object.values(row)[0] || "";
          return {
            text: String(textVal),
            date: row.date || row.Date ? String(row.date || row.Date) : undefined,
            rating: row.rating || row.Rating ? String(row.rating || row.Rating) : undefined,
          };
        });
      setCsvData(parsed);
    } catch {
      setResult({ success: false, message: "Failed to parse file. Please ensure it's a valid CSV/XLSX." });
    }
  };

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === "single" ? "active" : ""}`} onClick={() => setTab("single")}>
          <Type size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Single Review
        </button>
        <button className={`tab ${tab === "bulk" ? "active" : ""}`} onClick={() => setTab("bulk")}>
          <List size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Bulk Text
        </button>
        <button className={`tab ${tab === "csv" ? "active" : ""}`} onClick={() => setTab("csv")}>
          <FileText size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> File Upload
        </button>
      </div>

      {}
      {result && (
        <div style={{
          padding: "14px 20px", borderRadius: "var(--radius)", marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
          background: result.success ? "#ECFDF5" : "#FEF2F2",
          color: result.success ? "#059669" : "#DC2626",
          border: `1px solid ${result.success ? "#A7F3D0" : "#FECACA"}`,
        }}>
          {result.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontWeight: 500, fontSize: 14 }}>{result.message}</span>
        </div>
      )}

      {}
      {loading && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "var(--color-muted-foreground)" }}>
            <span style={{ fontStyle: "italic", fontWeight: 500 }}>{currentFact}</span>
            <span style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, transition: "width 0.3s ease-out" }} /></div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-primary)", fontWeight: 500 }}>
            <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            <span>{etaSeconds !== null ? `ETA: ${formatTime(etaSeconds)}` : "Calculating ETA..."}</span>
          </div>
        </div>
      )}

      {}
      {tab === "single" && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Review Text</label>
            <textarea className="form-textarea" placeholder="Enter a customer review..." value={singleText} onChange={(e) => setSingleText(e.target.value)} rows={4} />
          </div>
          <button className="btn btn-primary" disabled={!singleText.trim() || loading} onClick={() => handleUpload([{ text: singleText.trim(), source: "manual" }])}>
            {loading ? <><Loader2 size={16} className="spin" /> Processing...</> : <><Upload size={16} /> Analyze Review</>}
          </button>
        </div>
      )}

      {}
      {tab === "bulk" && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Paste Multiple Reviews (one per line)</label>
            <textarea className="form-textarea" placeholder="Great food and service!&#10;Waited too long for our order.&#10;Average experience overall." value={bulkText} onChange={(e) => setBulkText(e.target.value)} style={{ minHeight: 200 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
              {bulkText.trim() ? bulkText.trim().split("\n").filter(Boolean).length : 0} reviews detected
            </span>
            <button className="btn btn-primary" disabled={!bulkText.trim() || loading} onClick={() => {
              const reviews = bulkText.trim().split("\n").filter(Boolean).map((t) => ({ text: t.trim(), source: "manual" }));
              handleUpload(reviews);
            }}>
              {loading ? <><Loader2 size={16} /> Processing...</> : <><Upload size={16} /> Upload All</>}
            </button>
          </div>
        </div>
      )}

      {}
      {tab === "csv" && (
        <div className="card">
          <div className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragging"); }} onDragLeave={(e) => e.currentTarget.classList.remove("dragging")} onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("dragging"); if (e.dataTransfer.files[0]) handleCSVParse(e.dataTransfer.files[0]); }}>
            <Upload size={32} style={{ color: "var(--color-muted-foreground)", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Drop CSV/Excel file here or click to browse</p>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>Expected format: review, date, rating (supports .csv, .xls, .xlsx)</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv, .xls, .xlsx" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleCSVParse(e.target.files[0]); }} />

          {csvData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 500 }}>{csvData.length} reviews parsed</span>
                <button className="btn btn-primary" disabled={loading} onClick={() => handleUpload(csvData.map((r) => ({ ...r, source: "csv" })))}>
                  {loading ? <><Loader2 size={16} /> Processing...</> : <><Upload size={16} /> Process All</>}
                </button>
              </div>
              <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
                <table className="data-table">
                  <thead><tr><th>#</th><th>Review</th><th>Date</th><th>Rating</th></tr></thead>
                  <tbody>
                    {csvData.slice(0, 20).map((r, i) => (
                      <tr key={i}><td>{i + 1}</td><td>{r.text.slice(0, 80)}...</td><td>{r.date || "-"}</td><td>{r.rating || "-"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 20 && <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginTop: 8, textAlign: "center" }}>Showing 20 of {csvData.length} reviews</p>}
            </div>
          )}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
