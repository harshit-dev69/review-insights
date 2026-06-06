"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, AreaChart, Area, Legend } from "recharts";

interface AnalyticsData {
  totalReviews: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
  avgConfidence: number;
  topCategories: { category: string; count: number }[];
  trendData: { date: string; positive: number; negative: number; neutral: number; total: number }[];
  complaintStats: { status: string; count: number }[];
}


export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCats, setGeneratingCats] = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const generateAICategories = async () => {
    setGeneratingCats(true);
    try {
      const res = await fetch("/api/analytics/ai-categories", { method: "POST" });
      const result = await res.json();
      if (result.success && data) {
        setData({ ...data, topCategories: result.topCategories });
      } else if (result.error) {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI categories");
    } finally {
      setGeneratingCats(false);
    }
  };

  useEffect(() => { document.title = "Analytics — Sentiment Insights Hub"; }, []);

  if (loading) return <div className="kpi-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;
  if (!data) return <div className="empty-state"><h3>Failed to load analytics</h3></div>;

  const sentimentPie = [
    { name: "Positive", value: data.positivePercent, color: "#059669" },
    { name: "Negative", value: data.negativePercent, color: "#DC2626" },
    { name: "Neutral", value: data.neutralPercent, color: "#D97706" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">Detailed Sentiment Timeline</span></div>
        {data.trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
                labelFormatter={(v) => {
                  const d = new Date(v as string);
                  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="positive" stroke="#059669" fill="#059669" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="negative" stroke="#DC2626" fill="#DC2626" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="neutral" stroke="#D97706" fill="#D97706" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="empty-state"><p>No trend data available to display timeline.</p></div>}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Sentiment Distribution</span></div>
          {data.totalReviews === 0 || (data.positivePercent === 0 && data.negativePercent === 0 && data.neutralPercent === 0) ? (
            <div className="empty-state"><p>No sentiment data available</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {sentimentPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} formatter={((value: number) => `${Number(value).toFixed(1)}%`) as never} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">Category Insights (Top 5)</span>
            <button className="btn btn-sm btn-secondary" onClick={generateAICategories} disabled={generatingCats}>
              {generatingCats ? <><Loader2 size={14} className="spin" style={{ marginRight: 4, display: "inline-block", animation: "spin 1s linear infinite" }} /> Generating...</> : "Generate AI Categories"}
            </button>
          </div>
          {data.topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topCategories.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={110} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">
            <p>No category data</p>
            <p style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginTop: 8 }}>Click "Generate AI Categories" to analyze reviews.</p>
          </div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Complaint Resolution Status</span></div>
          {data.complaintStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.complaintStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={90} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.complaintStats.map((s, i) => (
                    <Cell key={i} fill={s.status === "RESOLVED" ? "#059669" : s.status === "IN_PROGRESS" ? "#D97706" : "#DC2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No complaints tracking data</p></div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Data Summary Table</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Reviews Analyzed</strong></td>
                <td>{data.totalReviews.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Sentiment Distribution</strong></td>
                <td>
                  <span style={{ color: "#059669", marginRight: 12 }}>{data.positivePercent.toFixed(1)}% Pos</span>
                  <span style={{ color: "#DC2626", marginRight: 12 }}>{data.negativePercent.toFixed(1)}% Neg</span>
                  <span style={{ color: "#D97706" }}>{data.neutralPercent.toFixed(1)}% Neu</span>
                </td>
              </tr>
              <tr>
                <td><strong>Average AI Confidence</strong></td>
                <td>{data.avgConfidence.toFixed(1)}%</td>
              </tr>
              <tr>
                <td><strong>Open Complaints</strong></td>
                <td>
                  <span style={{ color: "#DC2626", fontWeight: 600 }}>
                    {data.complaintStats.find((s) => s.status === "OPEN")?.count || 0}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
