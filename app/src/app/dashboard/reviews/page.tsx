"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { Search, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";

interface Review {
  id: string;
  reviewText: string;
  source: string;
  rating: number | null;
  reviewDate: string;
  createdAt: string;
  aiAnalysis: { sentiment: string; confidence: number; category: string } | null;
  complaint: { status: string } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: "single" | "all"; id?: string } | null>(null);

  
  useEffect(() => {
    fetch("/api/reviews/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (sentiment) params.set("sentiment", sentiment);
    if (category) params.set("category", category);

    fetch(`/api/reviews?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, sentiment, category]);

  useEffect(() => { document.title = "All Reviews — Sentiment Insights Hub"; }, []);
  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const deleteReview = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch (err) { console.error(err); }
    finally { setDeleting(null); setConfirmModal(null); }
  };

  const clearAllReviews = async () => {
    setDeleting("all");
    try {
      const res = await fetch("/api/reviews?all=true", { method: "DELETE" });
      if (res.ok) {
        setReviews([]);
        setTotal(0);
        setTotalPages(1);
        setPage(1);
      }
    } catch (err) { console.error(err); }
    finally { setDeleting(null); setConfirmModal(null); }
  };

  return (
    <div>
      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 11, color: "var(--color-muted-foreground)" }} />
          <input className="search-input" style={{ paddingLeft: 34, width: "100%" }} placeholder="Search reviews..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1); }}>
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <select className="filter-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginLeft: "auto" }}>{total} reviews</span>
        {total > 0 && (
          <button
            className="btn btn-sm"
            style={{ background: "#DC2626", color: "#fff", border: "none", marginLeft: 8 }}
            disabled={deleting === "all"}
            onClick={() => setConfirmModal({ type: "all" })}
          >
            {deleting === "all" ? "Clearing..." : "Clear All Reviews"}
          </button>
        )}
      </div>

      {loading ? (
        <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 4 }} />)}</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state"><h3>No reviews found</h3><p>Try adjusting your filters or upload some reviews.</p></div>
      ) : (
        <>
          <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Review</th><th>Sentiment</th><th>Confidence</th><th>Category</th><th>Date</th><th></th><th></th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <Fragment key={r.id}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                      <td style={{ maxWidth: 300 }}>{r.reviewText.slice(0, 80)}{r.reviewText.length > 80 ? "..." : ""}</td>
                      <td><span className={`badge badge-${r.aiAnalysis?.sentiment?.toLowerCase() || "neutral"}`}>{r.aiAnalysis?.sentiment || "N/A"}</span></td>
                      <td>{r.aiAnalysis?.confidence?.toFixed(1)}%</td>
                      <td>{r.aiAnalysis?.category || "-"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(r.reviewDate || r.createdAt)}</td>
                      <td>{expanded === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: "#DC2626", padding: "4px 6px" }}
                          disabled={deleting === r.id}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ type: "single", id: r.id }); }}
                          title="Delete review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr key={`${r.id}-exp`}>
                        <td colSpan={7} style={{ background: "var(--color-muted)", padding: 20 }}>
                          <p style={{ marginBottom: 12, lineHeight: 1.6 }}>{r.reviewText}</p>
                          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--color-muted-foreground)" }}>
                            <span>Source: {r.source}</span>
                            {r.rating && <span>Rating: {r.rating}/5</span>}
                            {r.complaint && <span>Complaint: <span className={`badge badge-${r.complaint.status.toLowerCase().replace("_","-")}`}>{r.complaint.status}</span></span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return <button key={p} className={`pagination-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}

      {}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--color-card)", borderRadius: 12, padding: 28, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={20} style={{ color: "#DC2626" }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                {confirmModal.type === "all" ? "Clear All Reviews?" : "Delete Review?"}
              </h3>
            </div>
            <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", lineHeight: 1.6, margin: "0 0 24px" }}>
              {confirmModal.type === "all"
                ? "This will permanently delete all reviews, their AI analyses, complaints, and cached analytics for this workspace. This action cannot be undone."
                : "This will permanently delete this review, its AI analysis, and any associated complaint. This action cannot be undone."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setConfirmModal(null)} disabled={!!deleting}>Cancel</button>
              <button
                className="btn btn-sm"
                style={{ background: "#DC2626", color: "#fff", border: "none" }}
                disabled={!!deleting}
                onClick={() => confirmModal.type === "all" ? clearAllReviews() : deleteReview(confirmModal.id!)}
              >
                {deleting ? "Deleting..." : confirmModal.type === "all" ? "Yes, Clear All" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
