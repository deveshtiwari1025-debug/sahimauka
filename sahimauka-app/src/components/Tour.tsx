import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BRAND, COLORS } from "@/constants";
import { tourActions, useTourSeen } from "@/lib/persistence";

type Slide = {
  emoji: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    emoji: "🛡️",
    title: "Welcome",
    body: "Verified opportunities only. If a listing is here, its source has been checked — no forwarded-in-WhatsApp rumours.",
  },
  {
    emoji: "🌐",
    title: "Feed",
    body: "Real official sources: Devpost & PIB Govt of India — every item links to its official page.",
  },
  {
    emoji: "⏰",
    title: "Deadlines",
    body: "Countdowns + reminders at 7, 3, 1 days and the day itself.",
  },
  {
    emoji: "🎯",
    title: "Ready",
    body: "Track what matters. Sahi mauka, sahi samay.",
  },
];

export default function Tour() {
  const [seen] = useTourSeen();
  const [step, setStep] = useState(0);

  if (seen) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const finish = () => {
    tourActions.markSeen();
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.root}>
        <View style={styles.skipRow}>
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.slideArea}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
          >
            <Text style={styles.nextText}>{isLast ? "Start" : "Next"}</Text>
          </Pressable>
        </View>

        <Text style={styles.brandFoot}>{BRAND.name}</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  skip: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600",
    padding: 8,
  },
  slideArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.ink,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.muted,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    gap: 22,
    paddingBottom: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.line,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 22,
  },
  nextBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  brandFoot: {
    textAlign: "center",
    color: COLORS.line,
    fontSize: 12,
    fontWeight: "600",
    paddingBottom: 6,
  },
});
