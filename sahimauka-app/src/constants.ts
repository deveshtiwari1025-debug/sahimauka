export const BRAND = {
  name: "SahiMauka",
  tagline: "Sahi mauka, sahi samay",
  taglineEn: "The right opportunity, at the right time",
};

export const FEED_BASE =
  typeof window !== "undefined" &&
  window.location.hostname === "localhost"
    ? "/feed"
    : "https://deveshtiwari1025-debug.github.io/sahimauka/feed";

export const SITE_BASE = "https://deveshtiwari1025-debug.github.io/sahimauka";

export const CATEGORIES = [
  { key: "all", label: "All", emoji: "✦" },
  { key: "hackathons", label: "Hackathons", emoji: "⚡" },
  { key: "scholarships", label: "Scholarships", emoji: "🎓" },
  { key: "exams", label: "Exams", emoji: "📝" },
  { key: "schemes", label: "Schemes", emoji: "🏛️" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const COLORS = {
  bg: "#FFFDF8",
  ink: "#1C1330",
  muted: "#6B6478",
  accent: "#7C3AED",
  accentSoft: "#F2EBFF",
  accent2: "#F59E0B",
  danger: "#DC2626",
  ok: "#059669",
  card: "#FFFFFF",
  line: "#E9E3F6",
  chipIdle: "#F4F0FB",
};
