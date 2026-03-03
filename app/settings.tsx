import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.placeholder}>BGM / SE Volume (TODO)</Text>
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
