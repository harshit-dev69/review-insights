"use client";

import { useEffect, useState } from "react";
import DashboardClient from "./dashboard-client";

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Dashboard — Sentiment Insights Hub"; }, []);

  useEffect(() => {
    
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/reviews?limit=5").then((r) => r.json()),
    ])
      .then(([analytics, reviewsData]) => {
        const reviews = reviewsData.reviews || [];
        const sentimentData = [
          { name: "Positive", value: analytics.positivePercent || 0, color: "#059669" },
          { name: "Negative", value: analytics.negativePercent || 0, color: "#DC2626" },
          { name: "Neutral", value: analytics.neutralPercent || 0, color: "#D97706" },
        ];

        const categoryData = (analytics.topCategories || []).map(
          (c: { category: string; count: number }) => ({ name: c.category, value: c.count })
        );

        setData({
          totalReviews: analytics.totalReviews || 0,
          avgConfidence: analytics.avgConfidence || 0,
          positivePercent: analytics.positivePercent || 0,
          openComplaints: (analytics.complaintStats || [])
            .filter((s: { status: string }) => s.status !== "RESOLVED")
            .reduce((sum: number, s: { count: number }) => sum + s.count, 0),
          sentimentData,
          trendData: analytics.trendData || [],
          categoryData,
          recentReviews: reviews.map((r: Record<string, unknown>) => ({
            id: r.id,
            text: r.reviewText,
            sentiment: (r.aiAnalysis as Record<string, unknown>)?.sentiment || "N/A",
            confidence: (r.aiAnalysis as Record<string, unknown>)?.confidence || 0,
            category: (r.aiAnalysis as Record<string, unknown>)?.category || "Unknown",
            date: r.createdAt,
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100 }} />
        ))}
      </div>
    );
  }

  return (
    <DashboardClient
      totalReviews={data.totalReviews as number}
      avgConfidence={data.avgConfidence as number}
      positivePercent={data.positivePercent as number}
      openComplaints={data.openComplaints as number}
      sentimentData={data.sentimentData as { name: string; value: number; color: string }[]}
      trendData={data.trendData as { date: string; positive: number; negative: number; neutral: number }[]}
      categoryData={data.categoryData as { name: string; value: number }[]}
      recentReviews={data.recentReviews as { id: string; text: string; sentiment: string; confidence: number; category: string; date: string }[]}
    />
  );
}
