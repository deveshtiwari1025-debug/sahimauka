import { useRouter } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OppCard } from "@/components/OppCard";
import { CATEGORIES, COLORS, type CategoryKey } from "@/constants";
import type { OppItem } from "@/lib/feed";
import { useFeed } from "@/lib/use-feed";

function relativeAge(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown time";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { width: "34%" }]} />
      <View style={[styles.skeletonLine, { width: "88%", height: 18 }]} />
      <View style={[styles.skeletonLine, { width: "55%" }]} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, index, stale, loading, refreshing, refresh } = useFeed();
  const [category, setCategory] = useState<CategoryKey>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter((it: OppItem) => {
      if (category !== "all" && it.category !== category) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) || it.org.toLowerCase().includes(q)
      );
    });
  }, [items, category, deferredQuery]);

  const openDetail = (item: OppItem) => {
    router.push(`/opp/${item.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title or organisation"
          placeholderTextColor={COLORS.muted}
          style={styles.search}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <View style={styles.chipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsInner}
        >
          {CATEGORIES.map((c) => {
            const active = c.key === category;
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                onPress={() => setCategory(c.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={loading ? ([] as OppItem[]) : filtered}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <OppCard item={item} onPress={openDetail} />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          loading ? undefined : (
            <View style={styles.freshness}>
              {stale ? (
                <View style={[styles.pill, { backgroundColor: "#FEF3DD" }]}>
                  <Text style={[styles.pillText, { color: COLORS.accent2 }]}>
                    Offline — showing the last synced feed
                  </Text>
                </View>
              ) : null}
              <View style={styles.pill}>
                <Text style={styles.pillText}>
                  {index
                    ? `Feed updated ${relativeAge(index.generated_at)} · ${index.total} verified items`
                    : "Feed status unknown — not synced yet"}
                </Text>
              </View>
              {index
                ? Object.entries(index.sources).map(([key, s]) => (
                    <View key={key} style={styles.pill}>
                      <Text style={styles.pillText}>
                        {s.label ?? key}: {s.status} ({s.items})
                      </Text>
                    </View>
                  ))
                : null}
            </View>
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonWrap}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Nothing in this view</Text>
              <Text style={styles.emptyBody}>
                No verified opportunities in this view yet — the feed updates
                every 2 hours from official sources. Pull down to refresh.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  search: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.ink,
    fontSize: 15,
  },
  chipsRow: {
    paddingTop: 10,
  },
  chipsInner: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.chipIdle,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.ink,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  freshness: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  pill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600",
  },
  skeletonWrap: {
    gap: 10,
    paddingTop: 4,
  },
  skeletonCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    gap: 10,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.chipIdle,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.ink,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: "center",
  },
});
