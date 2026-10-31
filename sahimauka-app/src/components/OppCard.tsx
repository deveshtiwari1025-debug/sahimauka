import { Feather } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSaved } from "@/lib/persistence";
import type { OppItem } from "@/lib/feed";
import { CATEGORIES, COLORS } from "@/constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CountdownInfo = {
  label: string;
  color: string;
  bg: string;
};

/** Pure countdown computation from an ISO deadline (or null = rolling). */
export function countdownInfo(deadline: string | null): CountdownInfo {
  if (!deadline) {
    return { label: "Open", color: COLORS.ok, bg: "#E7F5EF" };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline.trim());
  if (!m) return { label: "Open", color: COLORS.ok, bg: "#E7F5EF" };
  const deadlineDay = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(deadlineDay.getTime())) {
    return { label: "Open", color: COLORS.ok, bg: "#E7F5EF" };
  }
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const daysLeft = Math.round((deadlineDay.getTime() - startOfToday.getTime()) / DAY_MS);
  if (daysLeft < 0) {
    return { label: "Ended", color: COLORS.muted, bg: COLORS.chipIdle };
  }
  const label = daysLeft === 0 ? "Due today" : `${daysLeft}d left`;
  if (daysLeft <= 2) return { label, color: COLORS.danger, bg: "#FDEAEA" };
  if (daysLeft <= 7) return { label, color: COLORS.accent2, bg: "#FEF3DD" };
  return { label, color: COLORS.ok, bg: "#E7F5EF" };
}

function categoryChip(category: string): { emoji: string; label: string } {
  const found = CATEGORIES.find((c) => c.key === category);
  if (found) return { emoji: found.emoji, label: found.label };
  return { emoji: "📌", label: category };
}

function OppCardImpl({
  item,
  onPress,
  compact = false,
}: {
  item: OppItem;
  onPress?: (item: OppItem) => void;
  compact?: boolean;
}) {
  const [saved] = useSaved();
  const isSaved = useMemo(
    () => saved.some((s) => s.id === item.id),
    [saved, item.id]
  );
  const countdown = countdownInfo(item.deadline);
  const cat = categoryChip(item.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} — ${cat.label}`}
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: COLORS.accentSoft }]}>
          <Text style={styles.chipText}>
            {cat.emoji} {cat.label}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: countdown.bg }]}>
          <Text style={[styles.chipText, { color: countdown.color, fontWeight: "700" }]}>
            {countdown.label}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.title, compact && styles.titleCompact]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      <Text style={styles.meta} numberOfLines={1}>
        {item.org} · {item.source_label}
      </Text>

      <View style={styles.bottomRow}>
        {item.verification.source_verified ? (
          <View style={styles.verifiedRow}>
            <Feather name="check-circle" size={13} color={COLORS.ok} />
            <Text style={styles.verifiedText}>
              Verified · {item.verification.domain}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Feather
          name="bookmark"
          size={16}
          color={isSaved ? COLORS.accent : COLORS.line}
          style={isSaved ? styles.bookmarkSaved : undefined}
        />
      </View>
    </Pressable>
  );
}

export const OppCard = memo(OppCardImpl);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    gap: 8,
    shadowColor: "#1C1330",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardCompact: {
    padding: 12,
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    lineHeight: 21,
  },
  titleCompact: {
    fontSize: 15,
  },
  meta: {
    fontSize: 12,
    color: COLORS.muted,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.ok,
    fontWeight: "600",
  },
  bookmarkSaved: {
    // Filled look for the outline Feather glyph: heavier weight via tint.
    shadowColor: COLORS.accent,
    shadowOpacity: 0.9,
    shadowRadius: 1,
  },
});
