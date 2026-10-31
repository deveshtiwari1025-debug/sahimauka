import { openBrowserAsync } from "expo-web-browser";
import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

import { BRAND, CATEGORIES, COLORS, SITE_BASE } from "@/constants";
import { toggleTracked, useTracked } from "@/lib/persistence";
import {
  ensurePermission,
  listScheduled,
} from "@/lib/reminders";

const DEMO_VIDEO_URI = `${SITE_BASE}/media/demo.mp4`;
const BUSINESS_MODEL_URL =
  "https://github.com/deveshtiwari1025-debug/sahimauka/blob/main/BUSINESS_MODEL.md";
const PRIVACY_URL = `${SITE_BASE}/privacy.html`;
const APP_VERSION = "1.0.0";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

async function openUrl(url: string): Promise<void> {
  try {
    await openBrowserAsync(url);
  } catch {
    await Linking.openURL(url).catch(() => {
      // Nothing more we can do without a browser.
    });
  }
}

export default function MoreScreen() {
  const [tracked] = useTracked();

  // --- How it works: demo video with graceful 404 fallback -----------------
  const [videoFailed, setVideoFailed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const player = useVideoPlayer(showVideo ? DEMO_VIDEO_URI : null, (p) => {
    p.addListener("statusChange", (s) => {
      if (s.error) setVideoFailed(true);
    });
  });

  // --- Notifications -------------------------------------------------------
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">(
    "unknown"
  );
  const [scheduled, setScheduled] = useState<string[]>([]);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await Notifications.getPermissionsAsync();
      if (cancelled) return;
      setPermission(status.granted ? "granted" : "denied");
      setScheduled(await listScheduled());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshNotifications = async () => {
    setScheduled(await listScheduled());
  };

  const sendTest = async () => {
    const ok = await ensurePermission();
    setPermission(ok ? "granted" : "denied");
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      identifier: "test-notification",
      content: {
        title: "SahiMauka test 🔔",
        body: "This is what a deadline reminder will look like.",
      },
      trigger: null,
    });
    setTestSent(true);
    await refreshNotifications();
  };

  const openLanding = () => {
    void openUrl(SITE_BASE);
  };

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.content}
    >
      <Section title="How it works">
        <Text style={styles.body}>
          SahiMauka pulls a verified feed of student opportunities every 2
          hours — hackathons from Devpost, scholarships, exams and government
          schemes from PIB (Press Information Bureau, Govt of India). Every
          card links straight to the official page.
        </Text>
        {showVideo && !videoFailed ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            fullscreenOptions={{ enable: true }}
          />
        ) : null}
        {videoFailed ? (
          <Text style={styles.fallback}>
            Video coming with the next update.
          </Text>
        ) : null}
        {!showVideo ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.secondaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setShowVideo(true);
            }}
          >
            <Feather name="play" size={16} color={COLORS.accent} />
            <Text style={styles.secondaryBtnText}>Play demo video</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={openLanding}
        >
          <Feather name="globe" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Open the SahiMauka landing page</Text>
        </Pressable>
      </Section>

      <Section title="Tracked categories">
        <Text style={styles.body}>
          Pick what you want front-and-centre. Nothing leaves your device.
        </Text>
        <View style={styles.chipWrap}>
          {CATEGORIES.filter((c) => c.key !== "all").map((c) => {
            const active = tracked.includes(c.key);
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                onPress={() => {
                  void toggleTracked(c.key);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.emoji} {c.label} {active ? "✓" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Notifications">
        <Text style={styles.body}>
          Permission:{" "}
          <Text
            style={{
              fontWeight: "700",
              color: permission === "granted" ? COLORS.ok : COLORS.muted,
            }}
          >
            {permission === "unknown"
              ? "checking…"
              : permission === "granted"
                ? "granted ✓"
                : "not granted"}
          </Text>
        </Text>
        <Text style={styles.body}>
          {scheduled.length === 0
            ? "No reminders scheduled yet — open an opportunity and tap “Remind me”."
            : `${scheduled.length} reminder${scheduled.length === 1 ? "" : "s"} scheduled.`}
        </Text>
        {scheduled.length > 0 ? (
          <View style={styles.scheduledList}>
            {scheduled.map((id) => (
              <Text key={id} style={styles.scheduledId} numberOfLines={1}>
                · {id}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => {
            void sendTest();
          }}
        >
          <Feather name="bell" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Send a test notification</Text>
        </Pressable>
        {testSent ? (
          <Text style={styles.okNote}>Sent — check your notification shade.</Text>
        ) : null}
      </Section>

      <Section title="About">
        <Text style={styles.brand}>{BRAND.name}</Text>
        <Text style={styles.tagline}>
          {BRAND.tagline} — {BRAND.taglineEn}
        </Text>
        <Text style={styles.body}>
          Free for students, always. SahiMauka is supported by clearly-labelled
          sponsorships and affiliate links; we never sell your data — in fact,
          your saves, tracking and reminders stay entirely on this device.
        </Text>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.button,
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            void openUrl(BUSINESS_MODEL_URL);
          }}
        >
          <Feather name="file-text" size={16} color={COLORS.accent} />
          <Text style={styles.secondaryBtnText}>Business model (BUSINESS_MODEL.md)</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.button,
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            void openUrl(PRIVACY_URL);
          }}
        >
          <Feather name="shield" size={16} color={COLORS.accent} />
          <Text style={styles.secondaryBtnText}>Privacy policy</Text>
        </Pressable>
        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </Section>
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
    gap: 8,
  },
  section: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.ink,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "#000000",
  },
  fallback: {
    fontSize: 13,
    color: COLORS.accent2,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryBtn: {
    backgroundColor: COLORS.accentSoft,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.chipIdle,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
  scheduledList: {
    backgroundColor: COLORS.chipIdle,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  scheduledId: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: undefined,
  },
  okNote: {
    fontSize: 12,
    color: COLORS.ok,
    fontWeight: "600",
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.ink,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: "600",
  },
  version: {
    fontSize: 11,
    color: COLORS.muted,
  },
});
