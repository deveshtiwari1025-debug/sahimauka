import { Feather } from "@expo/vector-icons";
import { openBrowserAsync } from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { countdownInfo } from "@/components/OppCard";
import { CATEGORIES, COLORS } from "@/constants";
import type { OppItem } from "@/lib/feed";
import { toggleSaved, useSaved } from "@/lib/persistence";
import {
  cancelReminders,
  reminderIdsFor,
  scheduleDeadlineReminders,
} from "@/lib/reminders";
import { useFeed } from "@/lib/use-feed";

function categoryChip(category: string): { emoji: string; label: string } {
  const found = CATEGORIES.find((c) => c.key === category);
  if (found) return { emoji: found.emoji, label: found.label };
  return { emoji: "📌", label: category };
}

export default function OppDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, loading } = useFeed();
  const [saved] = useSaved();

  const item: OppItem | undefined = items.find((it) => it.id === id);

  const isSaved = saved.some((s) => s.id === id);

  // Reminders state is async-derived; never set synchronously during render.
  const [remindersOn, setRemindersOn] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderCount, setReminderCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { listScheduled } = await import("@/lib/reminders");
      const ids = await listScheduled();
      if (cancelled) return;
      const wanted = reminderIdsFor(id ?? "");
      setRemindersOn(ids.some((sid) => wanted.includes(sid)));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
        <View style={styles.skeletonBlock} />
        <View style={[styles.skeletonBlock, { height: 120 }]} />
      </ScrollView>
    );
  }

  if (!item) {
    return (
      <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🤷</Text>
          <Text style={styles.emptyTitle}>Not in the feed right now</Text>
          <Text style={styles.emptyBody}>
            This item is not in the live verified feed (it may have been
            removed at the source). Pull-to-refresh on Home to re-sync.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const countdown = countdownInfo(item.deadline);
  const cat = categoryChip(item.category);
  const fetchedDate = new Date(item.fetched_at);
  const fetchedLabel = Number.isNaN(fetchedDate.getTime())
    ? item.fetched_at
    : fetchedDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const openOfficial = async () => {
    try {
      await openBrowserAsync(item.url);
    } catch {
      await Linking.openURL(item.url).catch(() => {
        // No browser available; nothing else to do.
      });
    }
  };

  const onRemind = async () => {
    if (remindersOn) {
      setReminderBusy(true);
      await cancelReminders(item.id);
      setRemindersOn(false);
      setReminderCount(null);
      setReminderBusy(false);
      return;
    }
    setReminderBusy(true);
    const count = await scheduleDeadlineReminders({
      id: item.id,
      title: item.title,
      deadline: item.deadline,
    });
    setReminderBusy(false);
    if (count > 0) {
      setRemindersOn(true);
      setReminderCount(count);
    } else if (item.deadline == null) {
      setReminderCount(0);
    }
  };

  const onSave = async () => {
    await toggleSaved({
      id: item.id,
      saved_at: new Date().toISOString(),
      deadline: item.deadline,
    });
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: COLORS.accentSoft }]}>
          <Text style={styles.catChipText}>
            {cat.emoji} {cat.label}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: countdown.bg }]}>
          <Text style={[styles.countChipText, { color: countdown.color }]}>
            {countdown.label}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.org}>{item.org}</Text>

      <View style={styles.bigCountdown}>
        <Text style={styles.bigCountdownLabel}>Deadline</Text>
        <Text style={[styles.bigCountdownValue, { color: countdown.color }]}>
          {item.deadline
            ? `${new Date(`${item.deadline}T00:00:00`).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })} · ${countdown.label}`
            : "Rolling — no fixed date"}
        </Text>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.evidenceCard}>
        <View style={styles.evidenceHead}>
          <Feather
            name={item.verification.source_verified ? "check-circle" : "alert-circle"}
            size={16}
            color={item.verification.source_verified ? COLORS.ok : COLORS.accent2}
          />
          <Text style={styles.evidenceTitle}>
            {item.verification.source_verified
              ? "Source verified ✓"
              : "Source listed, verification pending"}
          </Text>
        </View>
        <Text style={styles.evidenceLine}>
          Source: {item.source_label} · domain {item.verification.domain} ·
          fetched {fetchedLabel}
        </Text>
        <Text style={styles.evidenceUrl} numberOfLines={1}>
          {item.url}
        </Text>
      </View>

      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          void openOfficial();
        }}
      >
        <Feather name="external-link" size={16} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>Open official page</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={reminderBusy}
        style={({ pressed }) => [
          styles.button,
          remindersOn ? styles.okBtn : styles.secondaryBtn,
          pressed && styles.pressed,
          reminderBusy && styles.disabled,
        ]}
        onPress={() => {
          void onRemind();
        }}
      >
        <Feather
          name={remindersOn ? "bell" : "bell-off"}
          size={16}
          color={remindersOn ? "#FFFFFF" : COLORS.accent}
        />
        <Text
          style={
            remindersOn ? styles.primaryBtnText : styles.secondaryBtnText
          }
        >
          {remindersOn
            ? "Reminders on ✓ (tap to cancel)"
            : reminderCount === 0
              ? "No reminders possible (no upcoming deadline)"
              : "Remind me"}
        </Text>
      </Pressable>
      {remindersOn && reminderCount != null ? (
        <Text style={styles.okNote}>
          {reminderCount} reminder{reminderCount === 1 ? "" : "s"} scheduled at
          09:00 on D-7, D-3, D-1 and deadline day.
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          isSaved ? styles.savedBtn : styles.secondaryBtn,
          pressed && styles.pressed,
        ]}
        onPress={() => {
          void onSave();
        }}
      >
        <Feather
          name="bookmark"
          size={16}
          color={isSaved ? COLORS.ink : COLORS.accent}
        />
        <Text style={isSaved ? styles.savedBtnText : styles.secondaryBtnText}>
          {isSaved ? "Saved ✓ (tap to remove)" : "Save"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.ink,
    lineHeight: 28,
  },
  org: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: -6,
  },
  bigCountdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  bigCountdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bigCountdownValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.ink,
  },
  evidenceCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  evidenceHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.ink,
  },
  evidenceLine: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
  evidenceUrl: {
    fontSize: 11,
    color: COLORS.accent,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  secondaryBtn: {
    backgroundColor: COLORS.accentSoft,
  },
  okBtn: {
    backgroundColor: COLORS.ok,
  },
  savedBtn: {
    backgroundColor: COLORS.chipIdle,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  savedBtnText: {
    color: COLORS.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  okNote: {
    fontSize: 12,
    color: COLORS.ok,
    fontWeight: "600",
    textAlign: "center",
    marginTop: -6,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  skeletonBlock: {
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
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
    paddingHorizontal: 12,
  },
});
