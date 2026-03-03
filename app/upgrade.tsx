import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { UPGRADE_CONFIG, getUpgradeCost } from '@/game/upgrades';
import { COLORS } from '@/constants/colors';

type UpgradeKey = 'atk' | 'hp' | 'speed';

const UPGRADE_KEYS: UpgradeKey[] = ['atk', 'hp', 'speed'];

const UPGRADE_ACTIONS: Record<UpgradeKey, () => boolean> = {
  atk: () => useSaveDataStore.getState().upgradeAtk(),
  hp: () => useSaveDataStore.getState().upgradeHp(),
  speed: () => useSaveDataStore.getState().upgradeSpeed(),
};

export default function UpgradeScreen() {
  const router = useRouter();
  const credits = useSaveDataStore((s) => s.credits);
  const upgrades = useSaveDataStore((s) => s.upgrades);

  const getLevelForKey = (key: UpgradeKey): number => {
    switch (key) {
      case 'atk': return upgrades.baseAtk;
      case 'hp': return upgrades.baseHp;
      case 'speed': return upgrades.baseSpeed;
    }
  };

  const handleUpgrade = (key: UpgradeKey) => {
    UPGRADE_ACTIONS[key]();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade</Text>
        <Text style={styles.credits}>{credits} Cr</Text>
      </View>

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
                  <Text style={styles.maxBadge}>MAX</Text>
                ) : (
                  <Text style={styles.levelText}>
                    Lv.{level} / {config.maxLevel}
                  </Text>
                )}
              </View>

              <Text style={styles.effectText}>
                +{config.effect}{key === 'speed' ? '%' : ''} / Lv
              </Text>

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
                    <Text style={styles.upgradeButtonText}>Upgrade</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/stages')}>
        <Text style={styles.backButtonText}>Back to Stages</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
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
  cards: { gap: 16 },
  card: {
    backgroundColor: '#ffffff11',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  levelText: {
    fontSize: 14,
    color: COLORS.lightGray,
    fontVariant: ['tabular-nums'],
  },
  maxBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.neonGreen,
    backgroundColor: COLORS.neonGreen + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  effectText: {
    fontSize: 14,
    color: COLORS.neonGreen,
    marginBottom: 12,
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
  },
  costInsufficient: {
    color: COLORS.neonRed,
  },
  upgradeButton: {
    backgroundColor: COLORS.neonBlue + '33',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  upgradeButtonDisabled: { opacity: 0.3 },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neonBlue,
  },
  backButton: {
    marginTop: 32,
    backgroundColor: '#ffffff22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
