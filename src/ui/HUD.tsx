import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGameSessionStore } from "@/stores/gameSessionStore";

function HPBar() {
  const hp = useGameSessionStore((s) => s.hp);
  const maxHp = useGameSessionStore((s) => s.maxHp);
  const ratio = maxHp > 0 ? hp / maxHp : 0;

  return (
    <View style={styles.hpContainer}>
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: ratio > 0.3 ? "#00e5ff" : "#ff4081",
            },
          ]}
        />
      </View>
      <Text style={styles.hpText}>
        {hp}/{maxHp}
      </Text>
    </View>
  );
}

function ScoreDisplay() {
  const score = useGameSessionStore((s) => s.score);

  return <Text style={styles.score}>{score.toLocaleString()}</Text>;
}

function HUDInner() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.topRow}>
        <HPBar />
        <ScoreDisplay />
      </View>
    </View>
  );
}

export const HUD = React.memo(HUDInner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hpContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hpTrack: {
    width: 120,
    height: 10,
    backgroundColor: "#1a1a2e",
    borderRadius: 5,
    overflow: "hidden",
  },
  hpFill: {
    height: "100%",
    borderRadius: 5,
  },
  hpText: {
    fontSize: 12,
    color: "#ffffffcc",
    fontVariant: ["tabular-nums"],
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffea00",
    fontVariant: ["tabular-nums"],
  },
});
