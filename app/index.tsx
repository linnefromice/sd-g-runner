import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/i18n";
import { COLORS } from "@/constants/colors";

/** Decorative corner brackets for HUD/sci-fi framing */
function CornerBrackets({ color, size = 10, thickness = 1 }: { color: string; size?: number; thickness?: number }) {
  const style = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[style, { top: -1, left: -1, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { top: -1, right: -1, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[style, { bottom: -1, left: -1, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { bottom: -1, right: -1, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </>
  );
}

export default function TitleScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.titleArea}>
        <View style={styles.titleBorder}>
          <CornerBrackets color={COLORS.neonBlue} size={14} thickness={2} />
          <Text style={styles.title}>{t.title.gameName}</Text>
        </View>
        {/* Decorative flanked divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerWing} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerWing} />
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={() => router.push("/stages")}>
          <CornerBrackets color={COLORS.neonBlue + '88'} size={8} />
          <Text style={styles.menuButtonText}>{t.title.start}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButtonSecondary} activeOpacity={0.7} onPress={() => router.push("/settings")}>
          <Text style={styles.menuButtonSecondaryText}>{t.title.settings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButtonSecondary} activeOpacity={0.7} onPress={() => router.push("/how-to-play")}>
          <Text style={styles.menuButtonSecondaryText}>{t.title.howToPlay}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 32,
  },
  titleArea: {
    alignItems: "center",
    marginBottom: 56,
  },
  titleBorder: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.neonBlue,
    letterSpacing: 5,
    textTransform: "uppercase",
    textShadowColor: COLORS.neonBlue + '66',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  dividerWing: {
    width: 48,
    height: 1,
    backgroundColor: COLORS.neonBlue + '44',
  },
  dividerDot: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.neonBlue + '88',
    transform: [{ rotate: '45deg' }],
  },
  menu: {
    width: "100%",
    maxWidth: 280,
    gap: 12,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
    shadowColor: COLORS.neonBlue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  menuButtonText: {
    fontSize: 18,
    color: COLORS.neonBlue,
    fontWeight: "700",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  menuButtonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
    backgroundColor: '#ffffff06',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
  },
  menuButtonSecondaryText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: "600",
    letterSpacing: 2,
  },
});
