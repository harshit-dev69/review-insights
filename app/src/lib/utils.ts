import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatConfidence(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment.toUpperCase()) {
    case "POSITIVE":
      return "var(--color-positive)";
    case "NEGATIVE":
      return "var(--color-destructive)";
    case "NEUTRAL":
      return "var(--color-accent)";
    default:
      return "var(--color-muted-foreground)";
  }
}

export function getSentimentLabel(sentiment: string): string {
  return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "OPEN":
      return "var(--color-destructive)";
    case "IN_PROGRESS":
      return "var(--color-accent)";
    case "RESOLVED":
      return "var(--color-positive)";
    default:
      return "var(--color-muted-foreground)";
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function parseCSVReviews(csvContent: string): Array<{
  text: string;
  date?: string;
  rating?: number;
}> {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const reviews = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 1 && parts[0].trim()) {
      reviews.push({
        text: parts[0].trim().replace(/^"|"$/g, ""),
        date: parts[1]?.trim() || undefined,
        rating: parts[2] ? parseInt(parts[2].trim()) : undefined,
      });
    }
  }
  return reviews;
}
