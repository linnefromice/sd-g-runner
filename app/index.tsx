import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { GateHelpOverlay } from "@/ui/GateHelpOverlay";

export default function TitleScreen() {
  const [showGateHelp, setShowGateHelp] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project G-Runner</Text>
      <Link href="/stages" style={styles.link}>
        <Text style={styles.linkText}>Start</Text>
      </Link>
      <Link href="/settings" style={styles.link}>
        <Text style={styles.linkText}>Settings</Text>
      </Link>
      <TouchableOpacity style={styles.link} onPress={() => setShowGateHelp(true)}>
        <Text style={styles.linkText}>How to Play</Text>
      </TouchableOpacity>
      {showGateHelp && <GateHelpOverlay onClose={() => setShowGateHelp(false)} />}
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
