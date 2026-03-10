import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { UPGRADE_CONFIG, getUpgradeCost } from '@/game/upgrades';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';

type UpgradeKey = 'atk' | 'hp' | 'speed' | 'def' | 'creditBoost';

const UPGRADE_KEYS: UpgradeKey[] = ['atk', 'hp', 'speed', 'def', 'creditBoost'];

const UPGRADE_ACTIONS: Record<UpgradeKey, () => boolean> = {
  atk: () => useSaveDataStore.getState().upgradeAtk(),
  hp: () => useSaveDataStore.getState().upgradeHp(),
  speed: () => useSaveDataStore.getState().upgradeSpeed(),
  def: () => useSaveDataStore.getState().upgradeDef(),
  creditBoost: () => useSaveDataStore.getState().upgradeCreditBoost(),
};

export default function UpgradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const credits = useSaveDataStore((s) => s.credits);
  const upgrades = useSaveDataStore((s) => s.upgrades);

  const getLevelForKey = (key: UpgradeKey): number => {
    switch (key) {
      case 'atk': return upgrades.baseAtk;
      case 'hp': return upgrades.baseHp;
      case 'speed': return upgrades.baseSpeed;
      case 'def': return upgrades.baseDef;
      case 'creditBoost': return upgrades.baseCreditBoost;
    }
  };

  const handleUpgrade = (key: UpgradeKey) => {
    UPGRADE_ACTIONS[key]();
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.upgrade.title}</Text>
        <Text style={styles.credits}>{credits} Cr</Text>
      </View>
      <View style={styles.headerLine} />

      <View style={styles.cards}>
        {UPGRADE_KEYS.map((key) => {
          const config = UPGRADE_CONFIG[key];
          const level = getLevelForKey(key);
          const isMaxed = level >= config.maxLevel;
          const cost = getUpgradeCost(key, level);
          const canAfford = credits >= cost;

          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{config.label}</Text>
                {isMaxed ? (
                  <Text style={styles.maxBadge}>{t.upgrade.max}</Text>
                ) : (
                  <Text style={styles.levelText}>
                    Lv.{level} / {config.maxLevel}
                  </Text>
                )}
              </View>

              <Text style={styles.effectText}>
                +{config.effect}{key === 'speed' ? '%' : ''} / Lv
              </Text>

              {/* Level progress bar */}
              <View style={styles.levelBar}>
                <View
                  style={[
                    styles.levelBarFill,
                    { width: `${(level / config.maxLevel) * 100}%` as `${number}%` },
                  ]}
                />
              </View>

              {!isMaxed && (
                <View style={styles.cardFooter}>
                  <Text style={[styles.costText, !canAfford && styles.costInsufficient]}>
                    {cost} Cr
                  </Text>
                  <TouchableOpacity
                    style={[styles.upgradeButton, (!canAfford || isMaxed) && styles.upgradeButtonDisabled]}
                    disabled={!canAfford || isMaxed}
                    onPress={() => handleUpgrade(key)}
                  >
                    <Text style={styles.upgradeButtonText}>{t.upgrade.title}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]}
        onPress={() => router.push('/stages')}
      >
        <Text style={styles.backButtonText}>{t.upgrade.backToStages}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLine: {
    height: 1,
    backgroundColor: COLORS.neonBlue + '33',
    marginBottom: 24,
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
  cards: { gap: 14 },
  card: {
    backgroundColor: '#ffffff08',
    borderRadius: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  levelText: {
    fontSize: 13,
    color: COLORS.lightGray,
    fontVariant: ['tabular-nums'],
  },
  maxBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.neonGreen,
    backgroundColor: COLORS.neonGreen + '18',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neonGreen + '44',
  },
  effectText: {
    fontSize: 13,
    color: COLORS.neonGreen,
    marginBottom: 10,
  },
  levelBar: {
    height: 3,
    backgroundColor: '#ffffff11',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: COLORS.neonBlue,
    borderRadius: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costText: {
    fontSize: 14,
    color: COLORS.scoreYellow,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  costInsufficient: {
    color: COLORS.neonRed,
  },
  upgradeButton: {
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '55',
  },
  upgradeButtonDisabled: { opacity: 0.3 },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.neonBlue,
    letterSpacing: 1,
  },
  backButton: {
    marginTop: 28,
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
