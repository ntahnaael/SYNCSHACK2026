import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '@/constants/pins';
import { useAppColors } from '@/hooks/use-app-colors';
import { hapticSelection } from '@/lib/haptics';
import { CATEGORY_LEGEND_IMAGES } from '@/constants/categoryAssets';
import { useThemeMode } from '@/store/ThemeContext';
import type { PinCategory } from '@/types';

type Props = {
  selectedCategory: PinCategory | null;
  onSelectCategory: (cat: PinCategory | null) => void;
};

const ALL_ICON_SVG = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
    <rect x="1" y="1" width="22" height="22" rx="7" fill="${fill}"/>
    <circle cx="8" cy="10" r="2" fill="white" opacity="0.9"/>
    <circle cx="16" cy="10" r="2" fill="white" opacity="0.9"/>
    <circle cx="8" cy="16" r="2" fill="white" opacity="0.9"/>
    <circle cx="16" cy="16" r="2" fill="white" opacity="0.9"/>
  </svg>`;

export function CategoryLegend({ selectedCategory, onSelectCategory }: Props) {
  const colors = useAppColors();
  const { isDark } = useThemeMode();

  const panelBg = colors.controlBg;
  const allIconFill = selectedCategory === null ? colors.textAccent : (isDark ? '#3A3A3F' : '#D4CFC9');
  const allUri = `data:image/svg+xml;utf8,${encodeURIComponent(ALL_ICON_SVG(allIconFill))}`;

  return (
    <View style={[styles.panel, { backgroundColor: panelBg, borderColor: colors.surfaceBorder }]}>

      {/* ALL row */}
      <Pressable
        accessibilityLabel="Show all categories"
        onPress={() => {
          hapticSelection();
          onSelectCategory(null);
        }}
        style={({ pressed }) => [
          styles.item,
          selectedCategory === null && [styles.activeItem, { backgroundColor: isDark ? 'rgba(245,158,11,0.10)' : 'rgba(217,119,6,0.08)' }],
          { opacity: pressed ? 0.72 : 1 },
        ]}>
        <Image source={{ uri: allUri }} style={styles.badge} contentFit="contain" />
        <Text style={[styles.label, { color: selectedCategory === null ? colors.text : colors.textMuted }, selectedCategory === null && styles.activeLabel]}>
          All
        </Text>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <Pressable
            key={cat.id}
            accessibilityLabel={`Filter by ${cat.label}`}
            onPress={() => {
              hapticSelection();
              onSelectCategory(isSelected ? null : cat.id);
            }}
            style={({ pressed }) => [
              styles.item,
              isSelected && [styles.activeItem, { backgroundColor: isDark ? `${cat.color}18` : `${cat.color}12` }],
              { opacity: pressed ? 0.72 : 1 },
            ]}>
            <View style={styles.badgeWrap}>
              <Image source={CATEGORY_LEGEND_IMAGES[cat.id]} style={styles.badge} contentFit="contain" />
              {isSelected && (
                <View style={[styles.selectedRing, { borderColor: cat.color }]} />
              )}
            </View>
            <Text style={[styles.label, { color: isSelected ? colors.text : colors.textSecondary }, isSelected && styles.activeLabel]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
    gap: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 12,
  },
  activeItem: {
    borderRadius: 14,
  },
  badgeWrap: {
    position: 'relative',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  selectedRing: {
    position: 'absolute',
    inset: -3,
    borderRadius: 12,
    borderWidth: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
