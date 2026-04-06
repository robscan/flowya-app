import React from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

export type DesignSystemGroupHeadingProps = {
  /** Ancla para TOC / scroll (p. ej. ds-group-primitivos). */
  id: string;
  title: string;
  textColor: string;
  onLayoutY?: (id: string, y: number) => void;
};

/** Título de capa (Primitivos, Componentes, Templates). */
export function DesignSystemGroupHeading({ id, title, textColor, onLayoutY }: DesignSystemGroupHeadingProps) {
  return (
    <View
      nativeID={id}
      style={styles.groupHeadingWrap}
      onLayout={(e: LayoutChangeEvent) => onLayoutY?.(id, e.nativeEvent.layout.y)}
    >
      <Text style={[styles.groupHeading, { color: textColor }]}>{title}</Text>
    </View>
  );
}

export type DesignSystemSectionProps = {
  id: string;
  title: string;
  titleColor: string;
  /** Color de cuerpo secundario para la descripción (p. ej. colors.textSecondary). */
  mutedColor: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  cardStyle: object;
  onLayoutY?: (id: string, y: number) => void;
};

/**
 * Bloque canónico de la vitrina DS: título + descripción opcional + card de demo.
 * `id` es la referencia estable para issues y TOC (scroll).
 */
export function DesignSystemSection({
  id,
  title,
  titleColor,
  mutedColor,
  description,
  children,
  cardStyle,
  onLayoutY,
}: DesignSystemSectionProps) {
  return (
    <View
      nativeID={id}
      style={styles.section}
      onLayout={(e: LayoutChangeEvent) => onLayoutY?.(id, e.nativeEvent.layout.y)}
    >
      <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
      <View style={[styles.sectionContent, cardStyle]}>
        {description != null ? (
          <Text style={[styles.sectionDescription, { color: mutedColor }]}>{description}</Text>
        ) : null}
        {children ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupHeadingWrap: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  groupHeading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  sectionContent: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
});
