import { useCallback, useEffect, useState } from "react";

import { loadFeed, type FeedIndex, type OppItem } from "@/lib/feed";

/**
 * Shared feed state for screens: serve-then-refresh via loadFeed(), with a
 * pull-to-refresh hook. No demo data — an empty result means the feed is
 * empty or unreachable.
 */
export type FeedView = {
  items: OppItem[];
  index: FeedIndex | null;
  stale: boolean;
  /** True until the first loadFeed() resolves. */
  loading: boolean;
  /** True while a pull-to-refresh reload is in flight. */
  refreshing: boolean;
};

export function useFeed(): FeedView & { refresh: () => Promise<void> } {
  const [view, setView] = useState<FeedView>({
    items: [],
    index: null,
    stale: false,
    loading: true,
    refreshing: false,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await loadFeed();
      if (cancelled) return;
      setView({
        items: r.items,
        index: r.index,
        stale: r.stale,
        loading: false,
        refreshing: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setView((v) => ({ ...v, refreshing: true }));
    const r = await loadFeed();
    setView({
      items: r.items,
      index: r.index,
      stale: r.stale,
      loading: false,
      refreshing: false,
    });
  }, []);

  return { ...view, refresh };
}
