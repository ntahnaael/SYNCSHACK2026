import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { hapticTap } from '@/lib/haptics';
import type { PinCategory } from '@/types';

import { CategoryLegend } from './CategoryLegend';
import { PixelBottomSheet } from './PixelBottomSheet';

type Props = {
  visible: boolean;
  selectedCategory: PinCategory | null;
  onSelectCategory: (category: PinCategory | null) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, selectedCategory, onSelectCategory, onClose }: Props) {
  const colors = useAppColors();

  return (
    <PixelBottomSheet
      visible={visible}
      onDismiss={onClose}
      origin="bottom-left"
      triggerOffsetFromBottom={244}
      zIndex={105}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textAccent }]}>MAP FILTERS</Text>
            <Text style={[styles.heading, { color: colors.text }]}>Explore categories</Text>
          </View>
          <Pressable
            accessibilityLabel="Close filters"
            onPress={() => {
              hapticTap();
              onClose();
            }}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.closeBtnBg },
              pressed && styles.closeButtonPressed,
            ]}>
            <Text style={[styles.closeText, { color: colors.closeIcon }]}>×</Text>
          </Pressable>
        </View>
        <CategoryLegend
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </View>
    </PixelBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.9 }],
  },
  closeText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
});
