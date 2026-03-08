import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/i18n";
import { COLORS } from "@/constants/colors";

export default function TitleScreen() {
  const t = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.titleArea}>
        <View style={styles.titleBorder}>
          <Text style={styles.title}>{t.title.gameName}</Text>
        </View>
        <View style={styles.subtitleLine} />
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push("/stages")}>
          <Text style={styles.menuButtonText}>{t.title.start}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButtonSecondary} onPress={() => router.push("/settings")}>
          <Text style={styles.menuButtonSecondaryText}>{t.title.settings}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButtonSecondary} onPress={() => router.push("/how-to-play")}>
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
    borderColor: COLORS.neonBlue + '66',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.neonBlue,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  subtitleLine: {
    width: 120,
    height: 1,
    backgroundColor: COLORS.neonBlue + '44',
    marginTop: 16,
  },
  menu: {
    width: "100%",
    maxWidth: 260,
    gap: 12,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center",
  },
  menuButtonText: {
    fontSize: 18,
    color: COLORS.neonBlue,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  menuButtonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
  },
  menuButtonSecondaryText: {
    fontSize: 16,
    color: COLORS.lightGray,
    fontWeight: "600",
    letterSpacing: 2,
  },
});
