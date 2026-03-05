import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "@/i18n";

export default function TitleScreen() {
  const t = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title.gameName}</Text>
      <Link href="/stages" style={styles.link}>
        <Text style={styles.linkText}>{t.title.start}</Text>
      </Link>
      <Link href="/settings" style={styles.link}>
        <Text style={styles.linkText}>{t.title.settings}</Text>
      </Link>
      <Link href="/how-to-play" style={styles.link}>
        <Text style={styles.linkText}>{t.title.howToPlay}</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a14",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00e5ff",
    marginBottom: 40,
  },
  link: {
    marginVertical: 8,
  },
  linkText: {
    fontSize: 20,
    color: "#ffffff",
  },
});
