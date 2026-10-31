import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { countdownInfo } from "@/components/OppCard";
import { COLORS } from "@/constants";
import type { OppItem } from "@/lib/feed";
import { useFeed } from "@/lib/use-feed";

const DAY_MS = 24 * 60 * 60 * 1000;

type Section = { key: string; title: string; data: OppItem[] };

function dayDiff(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return Number.NaN;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return Number.NaN;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / DAY_MS);
}

function buildSections(items: OppItem[]): Section[] {
  const dated = items
    .filter((it) => it.deadline != null && !Number.isNaN(dayDiff(it.deadline)))
    .sort((a, b) =>
      (a.deadline ?? "").localeCompare(b.deadline ?? "")
    );

  const thisWeek: OppItem[] = [];
  const thisMonth: OppItem[] = [];
  const later: OppItem[] = [];
  const ended: OppItem[] = [];

  for (const it of dated) {
    const d = dayDiff(it.deadline ?? "");
    if (d < 0) ended.push(it);
    else if (d <= 7) thisWeek.push(it);
    else if (d <= 31) thisMonth.push(it);
    else later.push(it);
  }

  const rolling = items.filter((it) => it.deadline == null);

  const sections: Section[] = [
    { key: "week", title: "This week", data: thisWeek },
    { key: "month", title: "This month", data: thisMonth },
    { key: "later", title: "Later", data: later },
    { key: "rolling", title: "Rolling / no fixed date", data: rolling },
  ];
  if (ended.length > 0) {
    sections.push({ key: "ended", title: "Ended", data: ended });
  }
  return sections.filter((s) => s.data.length > 0);
}

export default function DeadlinesScreen() {
  const router = useRouter();
  const { items, loading, refreshing, refresh } = useFeed();

  const sections = useMemo(() => buildSections(items), [items]);

  const openDetail = (item: OppItem) => {
    router.push(`/opp/${item.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
      <SectionList
        sections={loading ? [] : sections}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cd = countdownInfo(item.deadline);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => openDetail(item)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.org}
                </Text>
              </View>
              <View
                style={[
                  styles.countChip,
                  { backgroundColor: cd.bg },
                  item.deadline == null && styles.rollingChip,
                ]}
              >
                <Text style={[styles.countText, { color: cd.color }]}>
                  {cd.label}
                </Text>
              </View>
            </Pressable>
          );
        }}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonWrap}>
              <View style={[styles.skeletonLine, { width: "40%" }]} />
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={styles.emptyTitle}>No deadlines tracked yet</Text>
              <Text style={styles.emptyBody}>
                No deadline-bearing opportunities in the live feed right now —
                it refreshes every 2 hours from official sources.
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
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.ink,
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  rowMeta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  countChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rollingChip: {
    backgroundColor: COLORS.chipIdle,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
  },
  skeletonWrap: {
    paddingTop: 24,
    gap: 10,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.chipIdle,
  },
  skeletonRow: {
    height: 64,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
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
