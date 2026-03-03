import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function StageSelectScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stage Select</Text>
      <Link href="/stages/1/select-form" style={styles.link}>
        <Text style={styles.linkText}>Stage 1</Text>
      </Link>
      <Link href="/upgrade" style={styles.link}>
        <Text style={styles.linkText}>Upgrade</Text>
      </Link>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Back to Title</Text>
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#00e5ff",
    marginBottom: 24,
  },
  link: {
    marginVertical: 8,
  },
  linkText: {
    fontSize: 18,
    color: "#ffffff",
  },
});
