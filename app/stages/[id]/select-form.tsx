import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SelectFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Form</Text>
      <Text style={styles.subtitle}>Stage {id}</Text>
      <Link href={`/game/${id}`} style={styles.link}>
        <Text style={styles.linkText}>SD_Balanced (Start)</Text>
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
