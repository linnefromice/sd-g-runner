import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { getAvailableStageIds, getStage } from '@/game/stages';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';

/** Decorative corner brackets for HUD/sci-fi framing */
function CornerBrackets({ color, size = 10, thickness = 1 }: { color: string; size?: number; thickness?: number }) {
  const style = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[style, { top: -1, left: -1, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { top: -1, right: -1, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[style, { bottom: -1, left: -1, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { bottom: -1, right: -1, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </>
  );
}

export default function StageSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const unlockedStages = useSaveDataStore((s) => s.unlockedStages);
  const highScores = useSaveDataStore((s) => s.highScores);
  const credits = useSaveDataStore((s) => s.credits);

  const endlessBestTime = useSaveDataStore((s) => s.endlessBestTime);
  const endlessBestScore = useSaveDataStore((s) => s.endlessBestScore);

  const stageIds = getAvailableStageIds();
  const allNormalStagesUnlocked = Array.from({ length: 15 }, (_, i) => i + 1).every((id) =>
    unlockedStages.includes(id)
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.stageSelect.title}</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={styles.creditsBox}>
          <Text style={styles.creditsLabel}>CREDIT</Text>
          <Text style={styles.credits}>{credits} Cr</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {stageIds.map((id) => {
          const stage = getStage(id);
          const isUnlocked = unlockedStages.includes(id);
          const highScore = highScores[id];
          const isBoss = stage.isBossStage && isUnlocked;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.stageCard,
                !isUnlocked && styles.stageCardLocked,
                isBoss && styles.stageCardBoss,
              ]}
              activeOpacity={0.7}
              disabled={!isUnlocked}
              onPress={() => router.push(`/stages/${id}/select-form`)}
            >
              {/* Left accent bar */}
              <View
                style={[
                  styles.leftAccent,
                  { backgroundColor: isBoss ? COLORS.neonRed : isUnlocked ? COLORS.neonBlue : '#333' },
                ]}
              />
              <CornerBrackets
                color={isBoss ? COLORS.neonRed + '88' : isUnlocked ? COLORS.neonBlue + '66' : '#33333366'}
                size={8}
              />

              <View style={styles.stageContent}>
                <View style={styles.stageInfo}>
                  <Text style={[styles.stageNumber, !isUnlocked && styles.textLocked]}>
                    {isUnlocked ? `${t.stageSelect.stage} ${id}` : t.stageSelect.unknown}
                  </Text>
                  <Text
                    style={[
                      styles.stageName,
                      !isUnlocked && styles.textLocked,
                      isBoss && styles.stageNameBoss,
                    ]}
                  >
                    {isUnlocked ? stage.name : t.stageSelect.locked}
                  </Text>
                  {isBoss && (
                    <View style={styles.bossBadgeContainer}>
                      <View style={styles.bossBadgeDot} />
                      <Text style={styles.bossBadge}>{t.stageSelect.boss}</Text>
                    </View>
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
              </View>
            </TouchableOpacity>
          );
        })}

        {allNormalStagesUnlocked && (
          <TouchableOpacity
            style={styles.endlessCard}
            activeOpacity={0.7}
            onPress={() => router.push('/stages/99/select-form')}
          >
            <View style={[styles.leftAccent, { backgroundColor: '#BB66FF' }]} />
            <CornerBrackets color={'#BB66FF88'} size={8} />
            <View style={styles.stageContent}>
              <View style={styles.stageInfo}>
                <Text style={styles.endlessLabel}>{t.stageSelect.endless}</Text>
                <Text style={styles.endlessName}>ENDLESS MODE</Text>
              </View>
              <View style={styles.stageScore}>
                {endlessBestScore > 0 ? (
                  <>
                    <Text style={styles.endlessBestLabel}>{t.stageSelect.endlessBest}</Text>
                    <Text style={styles.endlessBestScore}>{endlessBestScore.toLocaleString()} pt</Text>
                    <Text style={styles.endlessBestTime}>{Math.floor(endlessBestTime)}s</Text>
                  </>
                ) : (
                  <Text style={styles.noScore}>---</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.footerButton} activeOpacity={0.7} onPress={() => router.push('/upgrade')}>
            <CornerBrackets color={COLORS.neonBlue + '55'} size={6} />
            <Text style={styles.footerButtonText}>{t.stageSelect.upgrade}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} activeOpacity={0.7} onPress={() => router.push('/achievements')}>
            <CornerBrackets color={COLORS.neonBlue + '55'} size={6} />
            <Text style={styles.footerButtonText}>{t.stageSelect.achievementsButton}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.footerButtonSecondary} activeOpacity={0.7} onPress={() => router.push('/')}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: COLORS.neonBlue + '66',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    height: 2,
    backgroundColor: COLORS.neonBlue + '44',
    marginTop: 6,
    borderRadius: 1,
  },
  creditsBox: {
    alignItems: 'flex-end',
  },
  creditsLabel: {
    fontSize: 9,
    color: COLORS.lightGray,
    letterSpacing: 3,
    marginBottom: 2,
  },
  credits: {
    fontSize: 18,
    color: COLORS.scoreYellow,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textShadowColor: COLORS.scoreYellow + '44',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 16,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#ffffff06',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
    overflow: 'hidden',
  },
  stageCardLocked: {
    backgroundColor: '#ffffff03',
    borderColor: '#ffffff0e',
  },
  stageCardBoss: {
    borderColor: COLORS.neonRed + '55',
    backgroundColor: COLORS.neonRed + '08',
    shadowColor: COLORS.neonRed,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  leftAccent: {
    width: 3,
  },
  stageContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 14,
  },
  stageInfo: { flex: 1 },
  stageNumber: {
    fontSize: 10,
    color: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  stageName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  stageNameBoss: {
    color: '#FFCCCC',
  },
  bossBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  bossBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.neonRed,
    shadowColor: COLORS.neonRed,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  bossBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonRed,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: COLORS.neonRed + '66',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  textLocked: { color: '#3a3a3a' },
  stageScore: { alignItems: 'flex-end' },
  highScore: {
    fontSize: 15,
    color: COLORS.scoreYellow,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noScore: {
    fontSize: 14,
    color: '#444444',
  },
  lockIcon: {
    fontSize: 12,
    color: '#3a3a3a',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    backgroundColor: COLORS.neonBlue + '18',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '55',
    shadowColor: COLORS.neonBlue,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  footerButtonText: {
    fontSize: 13,
    color: COLORS.neonBlue,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  endlessCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#BB66FF08',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#BB66FF55',
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#BB66FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  endlessLabel: {
    fontSize: 10,
    color: '#BB66FF',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  endlessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DDBBFF',
    marginTop: 3,
    letterSpacing: 1,
    textShadowColor: '#BB66FF44',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  endlessBestLabel: {
    fontSize: 9,
    color: COLORS.lightGray,
    letterSpacing: 2,
    marginBottom: 2,
  },
  endlessBestScore: {
    fontSize: 15,
    color: COLORS.scoreYellow,
    fontWeight: '700',
    fontVariant: ['tabular-nums' as const],
  },
  endlessBestTime: {
    fontSize: 11,
    color: COLORS.lightGray,
    fontVariant: ['tabular-nums' as const],
    marginTop: 2,
  },
  footerButtonSecondary: {
    flex: 1,
    backgroundColor: '#ffffff06',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  footerButtonSecondaryText: {
    fontSize: 13,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
