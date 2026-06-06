"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";

interface Complaint {
  id: string;
  status: string;
  severity: string;
  actionNote: string | null;
  createdAt: string;
  review: { id: string; reviewText: string; aiAnalysis: { sentiment: string; confidence: number; category: string } | null };
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveStatus, setResolveStatus] = useState("RESOLVED");
  const [saving, setSaving] = useState(false);

  const fetchComplaints = () => {
    setLoading(true);
    fetch("/api/reviews?limit=100&sentiment=negative")
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.reviews
          ?.filter((r: Record<string, unknown>) => r.complaint)
          .map((r: Record<string, unknown>) => ({
            ...(r.complaint as Complaint),
            review: { id: r.id, reviewText: r.reviewText, aiAnalysis: r.aiAnalysis },
          })) || [];
        setComplaints(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { document.title = "Complaints — Sentiment Insights Hub"; }, []);
  useEffect(() => { fetchComplaints(); }, []);

  const handleResolve = async () => {
    if (!resolveId) return;
    setSaving(true);
    try {
      await fetch(`/api/reviews/${resolveId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolveStatus, actionNote: resolveNote }),
      });
      setResolveId(null);
      setResolveNote("");
      fetchComplaints();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const filtered = filter === "ALL" ? complaints : complaints.filter((c) => c.status === filter);

  if (loading) return <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />)}</div>;

  return (
    <div>
      <div className="filter-bar">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All" : f.replace("_", " ")}
            <span style={{ marginLeft: 4, opacity: 0.7 }}>
              ({f === "ALL" ? complaints.length : complaints.filter((c) => c.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No complaints found</h3>
          <p>{filter === "ALL" ? "No negative reviews detected yet" : `No ${filter.toLowerCase().replace("_", " ")} complaints`}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge badge-${c.status.toLowerCase().replace("_", "-")}`}>
                    {c.status === "OPEN" ? <AlertTriangle size={12} style={{ marginRight: 4 }} /> : c.status === "IN_PROGRESS" ? <Clock size={12} style={{ marginRight: 4 }} /> : <CheckCircle size={12} style={{ marginRight: 4 }} />}
                    {c.status.replace("_", " ")}
                  </span>
                  <span className="badge badge-neutral">{c.severity}</span>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>{c.review?.aiAnalysis?.category}</span>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => { 
                  setResolveId(c.review?.id || c.id); 
                  setResolveStatus(c.status);
                  setResolveNote(c.actionNote || "");
                }}>
                  {c.status === "RESOLVED" ? "Edit Note / Reopen" : "Update Status"}
                </button>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--color-foreground)" }}>
                {c.review?.reviewText?.slice(0, 200)}{(c.review?.reviewText?.length || 0) > 200 ? "..." : ""}
              </p>
              {c.actionNote && (
                <div style={{ marginTop: 12, padding: 10, background: "var(--color-muted)", borderRadius: "var(--radius)", fontSize: 13 }}>
                  <strong>Resolution Note:</strong> {c.actionNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveId && (
        <div className="modal-overlay" onClick={() => { setResolveId(null); setResolveNote(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Update Complaint Status</h3>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={resolveStatus} onChange={(e) => setResolveStatus(e.target.value)}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Action Note</label>
              <textarea className="form-textarea" placeholder="Describe the resolution..." value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => { setResolveId(null); setResolveNote(""); }}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleResolve}>
                {saving ? <><Loader2 size={14} /> Saving...</> : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
