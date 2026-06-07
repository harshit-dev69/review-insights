import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentiment Insights Hub AI",
  description: "AI-Powered Customer Review Intelligence Platform — Analyze sentiment, detect complaints, and generate actionable business insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Allow redirects from localhost (dev), Vercel (production), and custom domains
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ].filter(Boolean);

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      allowedRedirectOrigins={allowedOrigins}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
