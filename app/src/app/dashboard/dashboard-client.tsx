"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

import { formatPercent, formatConfidence, truncate, formatDate } from "@/lib/utils";

interface Props {
  totalReviews: number;
  avgConfidence: number;
  positivePercent: number;
  openComplaints: number;
  sentimentData: { name: string; value: number; color: string }[];
  trendData: { date: string; positive: number; negative: number; neutral: number }[];
  categoryData: { name: string; value: number }[];
  recentReviews: { id: string; text: string; sentiment: string; confidence: number; category: string; date: string }[];
}

export default function DashboardClient({
  totalReviews, avgConfidence, positivePercent, openComplaints,
  sentimentData, trendData, categoryData, recentReviews
}: Props) {
  return (
    <div>
      {}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Reviews</div>
          <div className="kpi-value">{totalReviews.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Positive Rate</div>
          <div className="kpi-value" style={{ color: "var(--color-positive)" }}>{formatPercent(positivePercent)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Confidence</div>
          <div className="kpi-value">{formatConfidence(avgConfidence)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open Complaints</div>
          <div className="kpi-value" style={{ color: openComplaints > 0 ? "var(--color-destructive)" : "var(--color-positive)" }}>
            {openComplaints}
          </div>
        </div>
      </div>

      {}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sentiment Distribution</span>
          </div>
          {totalReviews > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                  {sentimentData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>Upload reviews to see sentiment distribution</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Trend Over Time</span>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="positive" stroke="#059669" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#D97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>Upload reviews to see trends</p></div>
          )}
        </div>
      </div>

      {}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Categories</span>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No category data yet</p></div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Reviews</span>
          </div>
          {recentReviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentReviews.map((r) => (
                <div key={r.id} style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className={`badge badge-${r.sentiment.toLowerCase()}`}>{r.sentiment}</span>
                    <span style={{ color: "var(--color-muted-foreground)", fontSize: 12 }}>{formatDate(r.date)}</span>
                  </div>
                  <p style={{ color: "var(--color-foreground)" }}>{truncate(r.text, 120)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No reviews yet. Upload some to get started!</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
