/**
 * Vitrina: ClearIconCircle — un solo tamaño canónico (26px + hitSlop); matriz alineada a la de botones.
 */

import { X } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { CLEAR_ICON_CIRCLE_TOKENS, ClearIconCircle } from './clear-icon-circle';

function MatrixRow({
  label,
  caption,
  metaColor,
  borderColor,
  children,
}: {
  label: string;
  caption?: string;
  metaColor: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.matrixRow, { borderBottomColor: borderColor }]}>
      <View style={styles.matrixLabelCol}>
        <Text style={[styles.matrixLabel, { color: metaColor }]}>{label}</Text>
        {caption ? (
          <Text style={[styles.matrixCaption, { color: metaColor }]}>{caption}</Text>
        ) : null}
      </View>
      <View style={styles.matrixDemoCol}>{children}</View>
    </View>
  );
}

function SnapshotCircle({ backgroundColor, iconColor }: { backgroundColor: string; iconColor: string }) {
  const { sizePx, iconPx } = CLEAR_ICON_CIRCLE_TOKENS;
  return (
    <View
      style={[
        styles.snapshotWrap,
        {
          width: sizePx,
          height: sizePx,
          borderRadius: sizePx / 2,
          backgroundColor,
        },
      ]}
    >
      <X size={iconPx} color={iconColor} strokeWidth={2} />
    </View>
  );
}

export function ClearIconCircleShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const border = colors.borderSubtle;
  const meta = colors.textSecondary;
  const mono = Platform.OS === 'web' ? ({ fontFamily: 'monospace' } as const) : undefined;

  const tokenRef = (
    <Text style={[styles.tokenLine, { color: meta }]}>
      Tokens:{' '}
      <Text style={mono}>
        CLEAR_ICON_CIRCLE_TOKENS.sizePx={CLEAR_ICON_CIRCLE_TOKENS.sizePx}
      </Text>
      ,{' '}
      <Text style={mono}>iconPx={CLEAR_ICON_CIRCLE_TOKENS.iconPx}</Text>,{' '}
      <Text style={mono}>hitSlop={CLEAR_ICON_CIRCLE_TOKENS.hitSlop}</Text>.
    </Text>
  );

  return (
    <View style={styles.root}>
      <Text style={[styles.intro, { color: meta }]}>
        Componente de producto:{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>ClearIconCircle</Text> desde{' '}
        <Text style={mono}>@/components/design-system/clear-icon-circle</Text>. No es un{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>IconButton</Text>: overlay gris sobre chips y campo de búsqueda.{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>Un solo tamaño</Text> en código y en producto; no hay variantes de tamaño.
      </Text>
      {tokenRef}

      <MatrixRow borderColor={border} label="Predeterminado" caption="Superficie bgDefault" metaColor={meta}>
        <ClearIconCircle
          onPress={() => {}}
          accessibilityLabel="Demo limpiar predeterminado"
          iconColor={colors.textSecondary}
        />
      </MatrixRow>
      <MatrixRow
        borderColor={border}
        label="Presionado (instantánea)"
        caption={`Mismo tinte que al pulsar — CLEAR_ICON_CIRCLE_TOKENS.bgPressed (${CLEAR_ICON_CIRCLE_TOKENS.bgPressed})`}
        metaColor={meta}
      >
        <SnapshotCircle backgroundColor={CLEAR_ICON_CIRCLE_TOKENS.bgPressed} iconColor={colors.textSecondary} />
      </MatrixRow>
      {Platform.OS === 'web' ? (
        <MatrixRow
          borderColor={border}
          label="Hover (web, instantánea)"
          caption={`Superficie hover — CLEAR_ICON_CIRCLE_TOKENS.bgHoverWeb (${CLEAR_ICON_CIRCLE_TOKENS.bgHoverWeb})`}
          metaColor={meta}
        >
          <SnapshotCircle backgroundColor={CLEAR_ICON_CIRCLE_TOKENS.bgHoverWeb} iconColor={colors.textSecondary} />
        </MatrixRow>
      ) : null}
      <MatrixRow borderColor={border} label="Deshabilitado" caption="opacity reducida; sin interacción" metaColor={meta}>
        <ClearIconCircle
          disabled
          onPress={() => {}}
          accessibilityLabel="Demo limpiar deshabilitado"
          iconColor={colors.textSecondary}
        />
      </MatrixRow>
      <MatrixRow
        borderColor={border}
        label="Enfoque teclado (web)"
        caption="Anillo stateFocusRing — prueba Tab"
        metaColor={meta}
      >
        <ClearIconCircle
          onPress={() => {}}
          accessibilityLabel="Demo limpiar para probar foco"
          iconColor={colors.textSecondary}
        />
      </MatrixRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: 0,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  tokenLine: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  matrixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matrixLabelCol: {
    width: 200,
    flexShrink: 0,
  },
  matrixLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  matrixCaption: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  matrixDemoCol: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  snapshotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
