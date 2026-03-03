import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { useEffect } from 'react';
import { COLORS } from '@/constants/colors';
import { getStageClearCredits } from '@/game/scoring';

export default function ResultScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const router = useRouter();
  const stageIdNum = Number(stageId) || 1;

  const score = useGameSessionStore((s) => s.score);
  const credits = useGameSessionStore((s) => s.credits);
  const isStageClear = useGameSessionStore((s) => s.isStageClear);

  // Persist results
  useEffect(() => {
    const saveStore = useSaveDataStore.getState();
    if (isStageClear) {
      saveStore.updateHighScore(stageIdNum, score);
      saveStore.addCredits(credits + getStageClearCredits(false));
      saveStore.unlockStage(stageIdNum + 1);
    } else {
      saveStore.updateHighScore(stageIdNum, score);
      saveStore.addCredits(credits);
    }
  }, [stageIdNum, score, credits, isStageClear]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isStageClear ? 'STAGE CLEAR!' : 'GAME OVER'}
      </Text>

      <View style={styles.stats}>
        <Text style={styles.label}>Score</Text>
        <Text style={styles.value}>{score.toLocaleString()}</Text>

        <Text style={styles.label}>Credits Earned</Text>
        <Text style={styles.value}>{credits} Cr</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(`/game/${stageIdNum}`)}
        >
          <Text style={styles.buttonText}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/stages')}
        >
          <Text style={styles.buttonText}>Stage Select</Text>
        </TouchableOpacity>

        {isStageClear && (
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={() => router.replace(`/game/${stageIdNum + 1}`)}
          >
            <Text style={styles.buttonText}>Next Stage</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    marginBottom: 40,
  },
  stats: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  label: { fontSize: 14, color: COLORS.lightGray },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  buttons: { gap: 12, width: '100%', maxWidth: 240 },
  button: {
    backgroundColor: '#ffffff22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: { backgroundColor: COLORS.neonBlue + '44' },
  buttonText: { fontSize: 16, color: COLORS.white, fontWeight: '600' },
});
