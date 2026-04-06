/**
 * Listado de niveles de exploración (flows / países). Usado en TravelerLevelsModal y CountriesSheet.
 */

import {
  TRAVELER_LEVELS,
  type TravelerLevel,
  formatTravelerLevelPointsRange,
} from '@/lib/traveler-levels';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export type TravelerLevelsListColors = {
  text: string;
  textSecondary: string;
  /** Fondo de la fila del nivel actual (p. ej. `colors.background` del tema). */
  rowCurrentBackground: string;
};

export type TravelerLevelsListProps = {
  /** Nivel marcado como actual (misma fila que en runtime). */
  currentLevel: TravelerLevel;
  colors: TravelerLevelsListColors;
  /** Por defecto `TRAVELER_LEVELS`. */
  levels?: TravelerLevel[];
};

export function TravelerLevelsList({
  currentLevel,
  colors,
  levels = TRAVELER_LEVELS,
}: TravelerLevelsListProps) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollEnabled =
    viewportHeight > 0 && contentHeight > viewportHeight + 2;

  return (
    <ScrollView
      style={styles.levelsList}
      contentContainerStyle={styles.levelsListContent}
      onLayout={(event) => setViewportHeight(Math.round(event.nativeEvent.layout.height))}
      onContentSizeChange={(_, h) => setContentHeight(Math.round(h))}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={scrollEnabled}
    >
      {levels.map((level) => {
        const isCurrent = level.level === currentLevel.level;
        return (
          <View
            key={level.level}
            style={[
              styles.levelRow,
              {
                backgroundColor: isCurrent ? colors.rowCurrentBackground : 'transparent',
              },
            ]}
          >
            <Text style={[styles.levelRowTitle, { color: isCurrent ? colors.text : colors.textSecondary }]}>
              {`Nivel ${level.level}: ${level.label}`}
            </Text>
            <Text style={[styles.levelRowRange, { color: colors.textSecondary }]}>
              {formatTravelerLevelPointsRange(level)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  levelsList: {
    width: '100%',
  },
  levelsListContent: {
    paddingHorizontal: 0,
    paddingBottom: Spacing.base,
    gap: 0,
  },
  levelRow: {
    minHeight: 44,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  levelRowTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
  },
  levelRowRange: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    minWidth: 92,
    textAlign: 'right',
  },
});
