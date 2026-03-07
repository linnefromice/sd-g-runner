import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';
import { getStageClearCredits } from '@/game/scoring';
import { getStage } from '@/game/stages';
import { calculateBonuses, applyScoreBonus, applyCreditBonus } from '@/game/bonuses';

export default function ResultScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const router = useRouter();
  const stageIdNum = Number(stageId) || 1;
  const t = useTranslation();

  const score = useGameSessionStore((s) => s.score);
  const credits = useGameSessionStore((s) => s.credits);
  const isStageClear = useGameSessionStore((s) => s.isStageClear);
  const damageTaken = useGameSessionStore((s) => s.damageTaken);
  const awakenedCount = useGameSessionStore((s) => s.awakenedCount);
  const enemiesSpawned = useGameSessionStore((s) => s.enemiesSpawned);
  const enemiesKilled = useGameSessionStore((s) => s.enemiesKilled);
  const finalStageTime = useGameSessionStore((s) => s.finalStageTime);

  const stage = getStage(stageIdNum);
  const clearBonus = isStageClear ? getStageClearCredits(stage.isBossStage) : 0;
  const totalCredits = credits + clearBonus;

  const bonuses = useMemo(
    () =>
      isStageClear
        ? calculateBonuses({
            damageTaken,
            awakenedCount,
            enemiesSpawned,
            enemiesKilled,
            isBossStage: stage.isBossStage,
            remainingTime: stage.duration - finalStageTime,
          })
        : [],
    [isStageClear, damageTaken, awakenedCount, enemiesSpawned, enemiesKilled, stage.isBossStage, stage.duration, finalStageTime],
  );

  const finalScore = isStageClear ? applyScoreBonus(score, bonuses) : score;
  const finalCredits = isStageClear ? applyCreditBonus(totalCredits, bonuses) : totalCredits;

  const BONUS_LABELS: Record<string, keyof typeof t.result> = {
    noDamage: 'bonusNoDamage',
    combo: 'bonusCombo',
    fullClear: 'bonusFullClear',
    speedClear: 'bonusSpeedClear',
  };

  // Persist results (once only)
  const hasSaved = useRef(false);
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    const saveStore = useSaveDataStore.getState();
    saveStore.updateHighScore(stageIdNum, finalScore);
    saveStore.addCredits(finalCredits);
    if (isStageClear) {
      saveStore.unlockStage(stageIdNum + 1);
    }
  }, [stageIdNum, finalScore, finalCredits, isStageClear]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isStageClear ? t.result.stageClear : t.result.gameOver}
      </Text>

      <View style={styles.stats}>
        <Text style={styles.label}>{t.result.score}</Text>
        <Text style={styles.value}>{finalScore.toLocaleString()}</Text>

        <Text style={styles.label}>{t.result.creditsEarned}</Text>
        <Text style={styles.value}>{finalCredits} Cr</Text>
        {clearBonus > 0 && (
          <Text style={styles.bonusText}>{t.result.clearBonus(clearBonus)}</Text>
        )}
      </View>

      {bonuses.length > 0 && (
        <View style={styles.bonusSection}>
          <Text style={styles.bonusTitle}>{t.result.bonusTitle}</Text>
          {bonuses.map((b) => (
            <View key={b.key} style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>
                {String(t.result[BONUS_LABELS[b.key]])}
              </Text>
              {b.points > 0 && <Text style={styles.bonusValue}>+{b.points}</Text>}
            </View>
          ))}
          {bonuses.some((b) => b.key === 'noDamage') && (
            <Text style={styles.bonusMultiplier}>{t.result.bonusScoreMultiplier}</Text>
          )}
          {bonuses.some((b) => b.creditMultiplier > 1) && (
            <Text style={styles.bonusMultiplier}>{t.result.bonusCreditMultiplier}</Text>
          )}
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(`/game/${stageIdNum}`)}
        >
          <Text style={styles.buttonText}>{t.result.replay}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/stages')}
        >
          <Text style={styles.buttonText}>{t.result.stageSelect}</Text>
        </TouchableOpacity>

        {isStageClear && (
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={() => router.replace(`/game/${stageIdNum + 1}`)}
          >
            <Text style={styles.buttonText}>{t.result.nextStage}</Text>
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
  bonusText: { fontSize: 12, color: COLORS.neonGreen, marginTop: -4 },
  bonusSection: { alignItems: 'center' as const, marginBottom: 24, gap: 4 },
  bonusTitle: { fontSize: 16, fontWeight: 'bold' as const, color: '#FFD700', marginBottom: 8 },
  bonusRow: { flexDirection: 'row' as const, gap: 12, alignItems: 'center' as const },
  bonusLabel: { fontSize: 14, color: '#AAAACC' },
  bonusValue: { fontSize: 14, color: '#00FF88', fontWeight: '600' as const },
  bonusMultiplier: { fontSize: 12, color: '#FFD700', marginTop: 4 },
});
