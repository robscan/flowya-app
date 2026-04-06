/**
 * Design System: Buttons.
 * Primary y secondary con estados pressed canónicos.
 * No usar opacity como feedback.
 * Web: touch-action manipulation evita zoom por doble tap.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ButtonPrimaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Estado persistente (filtros, toggle, fila activa). Misma superficie que presionado/hover. */
  selected?: boolean;
  accessibilityLabel?: string;
};

export function ButtonPrimary({
  children,
  onPress,
  disabled = false,
  loading = false,
  selected = false,
  accessibilityLabel,
}: ButtonPrimaryProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = Colors[useColorScheme() ?? 'light'];
  const interactiveDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: interactiveDisabled
            ? colors.primary
            : pressed
              ? colors.tintPressed
              : selected
                ? colors.tintPressed
                : hovered && Platform.OS === 'web'
                  ? colors.tintPressed
                  : colors.primary,
          opacity: interactiveDisabled ? 0.6 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
        WebTouchManipulation,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={interactiveDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: interactiveDisabled, busy: loading, selected }}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={styles.primaryLabel}>{children}</Text>
      </View>
    </Pressable>
  );
}

export type ButtonSecondaryProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Estado persistente (pestaña activa, opción elegida). */
  selected?: boolean;
  accessibilityLabel?: string;
};

export function ButtonSecondary({
  children,
  onPress,
  disabled = false,
  loading = false,
  selected = false,
  accessibilityLabel,
}: ButtonSecondaryProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = Colors[useColorScheme() ?? 'light'];
  const interactiveDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondary,
        {
          borderColor: colors.border,
          backgroundColor:
            pressed && !interactiveDisabled
              ? colors.stateSurfacePressed
              : hovered && Platform.OS === 'web' && !interactiveDisabled
                ? colors.stateSurfaceHover
                : selected && !interactiveDisabled
                  ? colors.stateSurfacePressed
                  : 'transparent',
          opacity: interactiveDisabled ? 0.6 : 1,
        },
        focused && Platform.OS === 'web' ? { boxShadow: `0 0 0 2px ${colors.stateFocusRing}` } : null,
        WebTouchManipulation,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={interactiveDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: interactiveDisabled, busy: loading, selected }}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color={colors.text} /> : null}
        <Text style={[styles.secondaryLabel, { color: colors.text }]}>{children}</Text>
      </View>
    </Pressable>
  );
}

/** Vitrina canónica: una matriz por variante, sin duplicar secciones en la página DS. */
export function ButtonsShowcase() {
  const colors = Colors[useColorScheme() ?? 'light'];

  return (
    <View style={styles.showcaseRoot}>
      <Text style={[styles.canonIntro, { color: colors.textSecondary }]}>
        Componentes de producto:{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>ButtonPrimary</Text> y{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>ButtonSecondary</Text> desde{' '}
        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
          @/components/design-system/buttons
        </Text>
        . El estado <Text style={{ fontWeight: '600', color: colors.text }}>presionado</Text> lo gestiona{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>Pressable</Text> (transitorio). Instantáneas abajo =
        color de superficie equivalente para referencia visual.
      </Text>

      <Text style={[styles.variantHeading, { color: colors.text }]}>ButtonPrimary</Text>
      <MatrixRow borderColor={colors.borderSubtle} label="Predeterminado" metaColor={colors.textSecondary}>
        <ButtonPrimary accessibilityLabel="Primary predeterminado">Predeterminado</ButtonPrimary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Seleccionado (prop selected)" metaColor={colors.textSecondary}>
        <ButtonPrimary selected accessibilityLabel="Primary seleccionado">
          Seleccionado
        </ButtonPrimary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Cargando" metaColor={colors.textSecondary}>
        <ButtonPrimary loading accessibilityLabel="Primary cargando">
          Cargando
        </ButtonPrimary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Deshabilitado" metaColor={colors.textSecondary}>
        <ButtonPrimary disabled accessibilityLabel="Primary deshabilitado">
          Deshabilitado
        </ButtonPrimary>
      </MatrixRow>
      <MatrixRow
        borderColor={colors.borderSubtle}
        label="Presionado (instantánea)"
        caption="Mismo color que al pulsar: tintPressed"
        metaColor={colors.textSecondary}
      >
        <View style={[styles.primary, { backgroundColor: colors.tintPressed, justifyContent: 'center' }]}>
          <Text style={styles.primaryLabel}>Presionado</Text>
        </View>
      </MatrixRow>
      {Platform.OS === 'web' ? (
        <MatrixRow
          borderColor={colors.borderSubtle}
          label="Hover (web, instantánea)"
          caption="Mismo tinte que tintPressed"
          metaColor={colors.textSecondary}
        >
          <View style={[styles.primary, { backgroundColor: colors.tintPressed, justifyContent: 'center' }]}>
            <Text style={styles.primaryLabel}>Hover</Text>
          </View>
        </MatrixRow>
      ) : null}
      <MatrixRow
        borderColor={colors.borderSubtle}
        label="Enfoque teclado (web)"
        caption="Anillo: stateFocusRing — prueba Tab en la página"
        metaColor={colors.textSecondary}
      >
        <ButtonPrimary accessibilityLabel="Primary para probar foco">Enfocable</ButtonPrimary>
      </MatrixRow>

      <Text style={[styles.variantHeading, { color: colors.text, marginTop: Spacing.lg }]}>
        ButtonSecondary
      </Text>
      <MatrixRow borderColor={colors.borderSubtle} label="Predeterminado" metaColor={colors.textSecondary}>
        <ButtonSecondary accessibilityLabel="Secondary predeterminado">Predeterminado</ButtonSecondary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Seleccionado (prop selected)" metaColor={colors.textSecondary}>
        <ButtonSecondary selected accessibilityLabel="Secondary seleccionado">
          Seleccionado
        </ButtonSecondary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Cargando" metaColor={colors.textSecondary}>
        <ButtonSecondary loading accessibilityLabel="Secondary cargando">
          Cargando
        </ButtonSecondary>
      </MatrixRow>
      <MatrixRow borderColor={colors.borderSubtle} label="Deshabilitado" metaColor={colors.textSecondary}>
        <ButtonSecondary disabled accessibilityLabel="Secondary deshabilitado">
          Deshabilitado
        </ButtonSecondary>
      </MatrixRow>
      <MatrixRow
        borderColor={colors.borderSubtle}
        label="Presionado (instantánea)"
        caption="stateSurfacePressed"
        metaColor={colors.textSecondary}
      >
        <View
          style={[
            styles.secondary,
            {
              borderColor: colors.border,
              backgroundColor: colors.stateSurfacePressed,
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={[styles.secondaryLabel, { color: colors.text }]}>Presionado</Text>
        </View>
      </MatrixRow>
      {Platform.OS === 'web' ? (
        <MatrixRow borderColor={colors.borderSubtle} label="Hover (web, instantánea)" caption="stateSurfaceHover" metaColor={colors.textSecondary}>
          <View
            style={[
              styles.secondary,
              {
                borderColor: colors.border,
                backgroundColor: colors.stateSurfaceHover,
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={[styles.secondaryLabel, { color: colors.text }]}>Hover</Text>
          </View>
        </MatrixRow>
      ) : null}
      <MatrixRow
        borderColor={colors.borderSubtle}
        label="Enfoque teclado (web)"
        caption="Anillo: stateFocusRing — prueba Tab"
        metaColor={colors.textSecondary}
      >
        <ButtonSecondary accessibilityLabel="Secondary para probar foco">Enfocable</ButtonSecondary>
      </MatrixRow>
    </View>
  );
}

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

const styles = StyleSheet.create({
  showcaseRoot: {
    gap: 0,
    alignSelf: 'stretch',
  },
  canonIntro: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  variantHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
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
  primary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  secondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
});
