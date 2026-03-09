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
    const session = useGameSessionStore.getState();
    saveStore.updateHighScore(stageIdNum, finalScore);
    saveStore.addCredits(finalCredits);
    if (isStageClear) {
      saveStore.unlockStage(stageIdNum + 1);
    }

    // Achievement checks
    if (isStageClear && stageIdNum === 1) saveStore.unlockAchievement('first_clear');
    if (isStageClear && stage.isBossStage) saveStore.unlockAchievement('boss_slayer');
    if (isStageClear && session.damageTaken === 0) saveStore.unlockAchievement('no_damage_clear');
    if (session.awakenedCount > 0) saveStore.unlockAchievement('combo_master');
    if (isStageClear && session.currentForm === 'SD_Guardian') saveStore.unlockAchievement('guardian_angel');
    if (saveStore.unlockedStages.length >= 15) saveStore.unlockAchievement('all_stages');
    if (saveStore.unlockedForms.length >= 6) saveStore.unlockAchievement('all_forms');
    if (saveStore.credits >= 5000) saveStore.unlockAchievement('credit_hoarder');
    if (bonuses.some((b) => b.key === 'speedClear')) saveStore.unlockAchievement('speed_demon');
  }, [stageIdNum, finalScore, finalCredits, isStageClear, stage.isBossStage, bonuses]);

  return (
    <View style={styles.container}>
      <View style={styles.titleBorder}>
        <Text style={[styles.title, !isStageClear && styles.titleGameOver]}>
          {isStageClear ? t.result.stageClear : t.result.gameOver}
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.label}>{t.result.score}</Text>
          <Text style={styles.value}>{finalScore.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.label}>{t.result.creditsEarned}</Text>
          <Text style={styles.creditValue}>{finalCredits} Cr</Text>
        </View>
        {clearBonus > 0 && (
          <Text style={styles.bonusText}>{t.result.clearBonus(clearBonus)}</Text>
        )}
      </View>

      {bonuses.length > 0 && (
        <View style={styles.bonusCard}>
          <Text style={styles.bonusTitle}>{t.result.bonusTitle}</Text>
          {bonuses.map((b) => (
            <View key={b.key} style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>
                {String(t.result[BONUS_LABELS[b.key]])}
              </Text>
              {b.points > 0 && <Text style={styles.bonusPoints}>+{b.points}</Text>}
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
          onPress={() => router.replace(`/stages/${stageIdNum}/select-form`)}
          onLongPress={() => router.replace(`/game/${stageIdNum}`)}
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
            style={styles.nextButton}
            onPress={() => router.replace(`/game/${stageIdNum + 1}`)}
          >
            <Text style={styles.nextButtonText}>{t.result.nextStage}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titleBorder: {
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '55',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 2,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 3,
  },
  titleGameOver: {
    color: COLORS.neonRed,
  },
  statsCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#ffffff08',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
    borderRadius: 2,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff11',
    marginVertical: 12,
  },
  label: {
    fontSize: 13,
    color: COLORS.lightGray,
    letterSpacing: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  creditValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.scoreYellow,
    fontVariant: ['tabular-nums'],
  },
  bonusText: {
    fontSize: 11,
    color: COLORS.neonGreen,
    textAlign: 'right',
    marginTop: 4,
  },
  bonusCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#ffffff06',
    borderWidth: 1,
    borderColor: COLORS.scoreYellow + '33',
    borderRadius: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.scoreYellow,
    letterSpacing: 2,
    marginBottom: 8,
  },
  bonusRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bonusLabel: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  bonusPoints: {
    fontSize: 13,
    color: COLORS.neonGreen,
    fontWeight: '600',
  },
  bonusMultiplier: {
    fontSize: 11,
    color: COLORS.scoreYellow,
    marginTop: 4,
  },
  buttons: {
    gap: 10,
    width: '100%',
    maxWidth: 240,
  },
  button: {
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  buttonText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
  nextButton: {
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '66',
  },
  nextButtonText: {
    fontSize: 15,
    color: COLORS.neonBlue,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
