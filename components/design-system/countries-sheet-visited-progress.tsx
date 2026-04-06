/**
 * Bloque de progreso mundial + nivel (solo modo visitados en CountriesSheet).
 */

import { TRAVELER_LEVELS } from '@/lib/traveler-levels';
import { List } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export type CountriesSheetVisitedProgressColors = {
  text: string;
  textSecondary: string;
  primary: string;
  borderSubtle: string;
  stateSuccess: string;
};

export type CountriesSheetVisitedProgressProps = {
  worldPercentage: number;
  levelLabel: string;
  levelIndex: number;
  currentTravelerPoints: number;
  colors: CountriesSheetVisitedProgressColors;
  onPressLevels: () => void;
};

export function CountriesSheetVisitedProgress({
  worldPercentage,
  levelLabel,
  levelIndex,
  currentTravelerPoints,
  colors,
  onPressLevels,
}: CountriesSheetVisitedProgressProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(worldPercentage)));
  const levelTotal = TRAVELER_LEVELS.length;

  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${normalized}%`,
              backgroundColor: colors.stateSuccess,
            },
          ]}
        />
      </View>
      <View style={styles.progressMetaRow}>
        <Text style={[styles.progressCopy, { color: colors.textSecondary }]}>
          Nivel: <Text style={[styles.progressCopyLevelName, { color: colors.text }]}>{levelLabel}</Text>
        </Text>
        <Pressable
          onPress={onPressLevels}
          style={({ pressed }) => [styles.progressLevelButton, pressed ? styles.progressLevelButtonPressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Ver niveles de exploración. Nivel actual ${levelIndex} de ${levelTotal} con ${currentTravelerPoints} flows`}
        >
          <Text style={[styles.progressLevelButtonText, { color: colors.textSecondary }]}>
            {`${levelIndex}/${levelTotal}`}
          </Text>
          <List size={14} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressCopy: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
  },
  progressCopyLevelName: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  progressMetaRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  progressLevelButtonPressed: {
    opacity: 0.72,
  },
  progressLevelButtonText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
