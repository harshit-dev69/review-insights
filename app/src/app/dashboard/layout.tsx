"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard, Upload, BarChart3, Brain, MessageSquareWarning,
  FileText, Settings, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload Reviews", icon: Upload },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/insights", label: "AI Insights", icon: Brain },
  { href: "/dashboard/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/dashboard/reviews", label: "All Reviews", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const authLoaded = isTestMode ? true : isLoaded;
  const authSignedIn = isTestMode ? true : isSignedIn;

  const pageTitle = navItems.find(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  )?.label || "Dashboard";

  if (!authLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (!authSignedIn) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Please sign in to continue</h2>
        <Link href="/sign-in" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">Sentiment Insights</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="main-content">
        <header className="main-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-ghost btn-sm mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1>{pageTitle}</h1>
          </div>
          <UserButton />
        </header>
        <div className="page-content">{children}</div>
      </div>

      <style>{`
        .mobile-menu-btn { display: none; }
        @media (max-width: 768px) { .mobile-menu-btn { display: flex !important; } }
      `}</style>
    </div>
  );
}
