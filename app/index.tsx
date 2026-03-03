import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TitleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project G-Runner</Text>
      <Link href="/stages" style={styles.link}>
        <Text style={styles.linkText}>Start</Text>
      </Link>
      <Link href="/settings" style={styles.link}>
        <Text style={styles.linkText}>Settings</Text>
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
