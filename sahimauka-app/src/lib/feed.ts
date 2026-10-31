import { FEED_BASE } from "@/constants";

export type OppItem = {
  id: string;
  title: string;
  org: string;
  category: string;
  url: string;
  deadline: string | null; // ISO date (YYYY-MM-DD) or null = rolling/open
  description: string;
  source: string;
  source_label: string;
  fetched_at: string;
  published_at?: string;
  tags: string[];
  verification: {
    domain: string;
    source_verified: boolean;
    deadline_future: boolean | null;
    flags: string[];
    [k: string]: unknown;
  };
};

export type FeedIndex = {
  generated_at: string;
  total: number;
  counts: Record<string, number>;
  sources: Record<string, { status: string; items: number; label?: string }>;
  honesty_note: string;
};

const INDEX_URL = `${FEED_BASE}/index.json`;
const ALL_URL = `${FEED_BASE}/all.json`;
const CACHE_KEY = "feed.cache.v1";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

type CacheShape = { fetched_at: number; index: FeedIndex; items: OppItem[] };

let memoryCache: CacheShape | null = null;

async function readCache(): Promise<CacheShape | null> {
  if (memoryCache) return memoryCache;
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage"))
      .default;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    memoryCache = JSON.parse(raw) as CacheShape;
    return memoryCache;
  } catch {
    return null;
  }
}

async function writeCache(c: CacheShape): Promise<void> {
  memoryCache = c;
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage"))
      .default;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    // storage full/unavailable — memory cache still works for this session
  }
}

export type FeedResult = {
  items: OppItem[];
  index: FeedIndex | null;
  stale: boolean;
};

/**
 * Loads the live verified feed. Serve-then-refresh: cached data renders
 * instantly (marked stale); a network refresh updates it. If the network
 * fails, the last real data still shows — we never substitute fake items.
 */
export async function loadFeed(): Promise<FeedResult> {
  const cached = await readCache();
  const now = Date.now();
  if (cached && now - cached.fetched_at < CACHE_TTL_MS) {
    return { items: cached.items, index: cached.index, stale: false };
  }

  let result: FeedResult | null = null;
  try {
    const [idxRes, allRes] = await Promise.all([
      fetch(INDEX_URL),
      fetch(ALL_URL),
    ]);
    if (!idxRes.ok || !allRes.ok) throw new Error(`feed HTTP ${allRes.status}`);
    const index = (await idxRes.json()) as FeedIndex;
    const items = (await allRes.json()).items as OppItem[];
    if (!Array.isArray(items)) throw new Error("feed shape invalid");
    const fresh: CacheShape = { fetched_at: now, index, items };
    await writeCache(fresh);
    result = { items, index, stale: false };
  } catch {
    result = null;
  }

  if (result) return result;
  if (cached) return { items: cached.items, index: cached.index, stale: true };
  return { items: [], index: null, stale: false };
}
