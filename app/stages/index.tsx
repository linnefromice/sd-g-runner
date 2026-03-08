import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { getAvailableStageIds, getStage } from '@/game/stages';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';

export default function StageSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const unlockedStages = useSaveDataStore((s) => s.unlockedStages);
  const highScores = useSaveDataStore((s) => s.highScores);
  const credits = useSaveDataStore((s) => s.credits);

  const stageIds = getAvailableStageIds();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.stageSelect.title}</Text>
        <Text style={styles.credits}>{credits} Cr</Text>
      </View>
      <View style={styles.headerLine} />

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
                  {isUnlocked ? `${t.stageSelect.stage} ${id}` : t.stageSelect.unknown}
                </Text>
                <Text style={[styles.stageName, !isUnlocked && styles.textLocked]}>
                  {isUnlocked ? stage.name : t.stageSelect.locked}
                </Text>
                {stage.isBossStage && isUnlocked && (
                  <Text style={styles.bossBadge}>{t.stageSelect.boss}</Text>
                )}
              </View>
              <View style={styles.stageScore}>
                {isUnlocked && highScore != null ? (
                  <Text style={styles.highScore}>{highScore.toLocaleString()} pt</Text>
                ) : isUnlocked ? (
                  <Text style={styles.noScore}>---</Text>
                ) : (
                  <Text style={styles.lockIcon}>{t.stageSelect.lock}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.footerButton} onPress={() => router.push('/upgrade')}>
          <Text style={styles.footerButtonText}>{t.stageSelect.upgrade}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButtonSecondary} onPress={() => router.push('/')}>
          <Text style={styles.footerButtonSecondaryText}>{t.stageSelect.back}</Text>
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
    marginBottom: 12,
  },
  headerLine: {
    height: 1,
    backgroundColor: COLORS.neonBlue + '33',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  credits: {
    fontSize: 16,
    color: COLORS.scoreYellow,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 16,
  },
  stageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  stageCardLocked: {
    backgroundColor: '#ffffff04',
    borderColor: '#ffffff11',
  },
  stageInfo: { flex: 1 },
  stageNumber: {
    fontSize: 11,
    color: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
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
    letterSpacing: 2,
  },
  textLocked: { color: '#444444' },
  stageScore: { alignItems: 'flex-end' },
  highScore: {
    fontSize: 14,
    color: COLORS.scoreYellow,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  noScore: {
    fontSize: 14,
    color: '#555555',
  },
  lockIcon: {
    fontSize: 12,
    color: '#444444',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '66',
  },
  footerButtonText: {
    fontSize: 15,
    color: COLORS.neonBlue,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footerButtonSecondary: {
    flex: 1,
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  footerButtonSecondaryText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
