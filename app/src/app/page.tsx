import Link from "next/link";
import { BarChart3, Brain, Shield, TrendingUp, Upload, MessageSquareWarning } from "lucide-react";

export default function LandingPage() {
  return (
    <div>
      <nav className="landing-nav">
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-primary)", letterSpacing: -0.3 }}>
          Sentiment Insights Hub
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/sign-in" className="btn btn-ghost">Sign In</Link>
          <Link href="/sign-up" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 20, background: "var(--color-muted)", fontSize: 13, fontWeight: 500, color: "var(--color-primary)", marginBottom: 24 }}>
          AI-Powered Review Intelligence
        </div>
        <h1>Understand Your Customers Like Never Before</h1>
        <p>
          Upload customer reviews and let AI analyze sentiment, detect complaints, 
          identify trends, and generate actionable business insights — all in real time.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Analyzing Free
          </Link>
          <Link href="#features" className="btn btn-secondary btn-lg">
            See How It Works
          </Link>
        </div>
      </section>

      <section style={{ background: "var(--color-muted)", padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Trusted by businesses worldwide
        </p>
        <p style={{ fontSize: 14, color: "var(--color-muted-foreground)" }}>
          Restaurants · Cafés · Hotels · Salons · Retail · Support Teams
        </p>
      </section>

      <section id="features" className="landing-features">
        {[
          { icon: <Brain size={20} />, title: "AI Sentiment Analysis", desc: "Automatically classify reviews as positive, negative, or neutral with confidence scoring using advanced NLP models." },
          { icon: <BarChart3 size={20} />, title: "Real-Time Analytics", desc: "Interactive dashboards with sentiment trends, category breakdowns, and customer satisfaction metrics." },
          { icon: <Upload size={20} />, title: "Bulk Upload", desc: "Upload reviews via CSV, paste bulk text, or enter individually. Process hundreds of reviews in seconds." },
          { icon: <MessageSquareWarning size={20} />, title: "Complaint Tracking", desc: "Auto-detect negative reviews, track resolution status, and assign action notes to your team." },
          { icon: <TrendingUp size={20} />, title: "Trend Detection", desc: "Spot recurring issues and positive patterns over time with AI-generated executive summaries." },
          { icon: <Shield size={20} />, title: "Enterprise Security", desc: "Secure authentication, row-level data isolation, and encrypted connections to keep your data safe." },
        ].map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section style={{ textAlign: "center", padding: "80px 32px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, marginBottom: 16 }}>
          Ready to unlock customer insights?
        </h2>
        <p style={{ fontSize: 16, color: "var(--color-muted-foreground)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Join businesses using AI to make smarter decisions from customer feedback.
        </p>
        <Link href="/sign-up" className="btn btn-primary btn-lg">
          Get Started — It&apos;s Free
        </Link>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "24px 32px", textAlign: "center", fontSize: 13, color: "var(--color-muted-foreground)" }}>
        © 2026 Sentiment Insights Hub AI. All rights reserved.
      </footer>
    </div>
  );
}
