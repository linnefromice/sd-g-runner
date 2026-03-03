import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { getAvailableStageIds, getStage } from '@/game/stages';
import { COLORS } from '@/constants/colors';

export default function StageSelectScreen() {
  const router = useRouter();
  const unlockedStages = useSaveDataStore((s) => s.unlockedStages);
  const highScores = useSaveDataStore((s) => s.highScores);
  const credits = useSaveDataStore((s) => s.credits);

  const stageIds = getAvailableStageIds();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stage Select</Text>
        <Text style={styles.credits}>{credits} Cr</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {stageIds.map((id) => {
          const stage = getStage(id);
          const isUnlocked = unlockedStages.includes(id);
          const highScore = highScores[id];

          return (
            <TouchableOpacity
              key={id}
              style={[styles.stageCard, !isUnlocked && styles.stageCardLocked]}
              disabled={!isUnlocked}
              onPress={() => router.push(`/stages/${id}/select-form`)}
            >
              <View style={styles.stageInfo}>
                <Text style={[styles.stageNumber, !isUnlocked && styles.textLocked]}>
                  {isUnlocked ? `Stage ${id}` : '???'}
                </Text>
                <Text style={[styles.stageName, !isUnlocked && styles.textLocked]}>
                  {isUnlocked ? stage.name : 'LOCKED'}
                </Text>
                {stage.isBossStage && isUnlocked && (
                  <Text style={styles.bossBadge}>BOSS</Text>
                )}
              </View>
              <View style={styles.stageScore}>
                {isUnlocked && highScore != null ? (
                  <Text style={styles.highScore}>{highScore.toLocaleString()} pt</Text>
                ) : isUnlocked ? (
                  <Text style={styles.noScore}>---</Text>
                ) : (
                  <Text style={styles.lockIcon}>LOCK</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push('/upgrade')}>
          <Text style={styles.footerButtonText}>Upgrade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push('/')}>
          <Text style={styles.footerButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
  },
  credits: {
    fontSize: 16,
    color: COLORS.scoreYellow,
    fontWeight: '600',
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 16,
  },
  stageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff11',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
  },
  stageCardLocked: {
    backgroundColor: '#ffffff06',
    borderColor: '#ffffff11',
  },
  stageInfo: { flex: 1 },
  stageNumber: {
    fontSize: 12,
    color: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stageName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 2,
  },
  bossBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonRed,
    marginTop: 4,
    letterSpacing: 1,
  },
  textLocked: { color: '#555555' },
  stageScore: { alignItems: 'flex-end' },
  highScore: {
    fontSize: 14,
    color: COLORS.scoreYellow,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  noScore: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  lockIcon: {
    fontSize: 12,
    color: '#555555',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    backgroundColor: '#ffffff22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
