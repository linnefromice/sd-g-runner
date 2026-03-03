import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ResultScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Result</Text>
      <Text style={styles.subtitle}>Stage {stageId} Clear!</Text>
      <Text style={styles.placeholder}>Score: 12,345 (TODO)</Text>
      <Link href={`/game/${stageId}`} style={styles.link}>
        <Text style={styles.linkText}>Replay</Text>
      </Link>
      <Link href="/stages" style={styles.link}>
        <Text style={styles.linkText}>Stage Select</Text>
      </Link>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Title</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: "#00ff88",
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: "#888888",
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
