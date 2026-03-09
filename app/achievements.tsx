import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { ACHIEVEMENTS } from '@/game/achievements';
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

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const unlockedAchievements = useSaveDataStore((s) => s.achievements);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.achievements.title}</Text>
        <View style={styles.titleUnderline} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);
          const name = t.achievements[achievement.id] as string;
          const desc = t.achievements[`${achievement.id}_desc` as keyof typeof t.achievements] as string;

          return (
            <View
              key={achievement.id}
              style={[
                styles.card,
                isUnlocked && styles.cardUnlocked,
              ]}
            >
              <CornerBrackets
                color={isUnlocked ? COLORS.neonBlue + '66' : '#33333366'}
                size={8}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, isUnlocked && styles.cardNameUnlocked]}>
                    {name}
                  </Text>
                  <View style={[styles.badge, isUnlocked && styles.badgeUnlocked]}>
                    <Text style={[styles.badgeText, isUnlocked && styles.badgeTextUnlocked]}>
                      {isUnlocked ? t.achievements.unlocked : t.achievements.locked}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.cardDesc, isUnlocked && styles.cardDescUnlocked]}>
                  {desc}
                </Text>

                <Text style={[styles.cardReward, isUnlocked && styles.cardRewardUnlocked]}>
                  {t.achievements.reward}: +{achievement.reward} Cr
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t.stageSelect.back}</Text>
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
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff06',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#ffffff0e',
    overflow: 'hidden',
  },
  cardUnlocked: {
    borderColor: COLORS.neonBlue + '33',
    backgroundColor: '#ffffff08',
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a3a3a',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardNameUnlocked: {
    color: COLORS.white,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#ffffff06',
  },
  badgeUnlocked: {
    borderColor: COLORS.neonBlue + '66',
    backgroundColor: COLORS.neonBlue + '22',
    shadowColor: COLORS.neonBlue,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#555555',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badgeTextUnlocked: {
    color: COLORS.neonBlue,
  },
  cardDesc: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 16,
  },
  cardDescUnlocked: {
    color: COLORS.lightGray,
  },
  cardReward: {
    fontSize: 11,
    color: '#333333',
    fontWeight: '600',
  },
  cardRewardUnlocked: {
    color: COLORS.scoreYellow,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backButton: {
    backgroundColor: '#ffffff06',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
