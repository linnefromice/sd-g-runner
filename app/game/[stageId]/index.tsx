import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function GameScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Screen</Text>
      <Text style={styles.subtitle}>Stage {stageId}</Text>
      <Text style={styles.placeholder}>Game Canvas (TODO)</Text>
      <Link href={`/game/${stageId}/result`} style={styles.link}>
        <Text style={styles.linkText}>Simulate Clear → Result</Text>
      </Link>
      <Link href="/stages" style={styles.link}>
        <Text style={styles.linkText}>Back to Stages</Text>
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
    fontSize: 18,
    color: "#888888",
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: "#444444",
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
