/**
 * Vitrina: matriz de estados de IconButton (import canónico desde icon-button).
 */

import { Check, MapPin, MapPinPlus } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconButton } from './icon-button';

const ICON = 22;

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

export function IconButtonShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const border = colors.borderSubtle;
  const meta = colors.textSecondary;

  return (
    <View style={styles.root}>
      <Text style={[styles.intro, { color: meta }]}>
        Componente de producto:{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>IconButton</Text> desde{' '}
        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
          @/components/design-system/icon-button
        </Text>
        . Tamaño táctil 44×44; variantes <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>default</Text>,{' '}
        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>primary</Text>,{' '}
        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>savePin</Text>. El cierre circular compacto (X en pills/búsqueda) es{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>ClearIconCircle</Text>. Los controles del mapa (
        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>MapControls</Text>) solo apilan{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>IconButton</Text>; no tienen capa de estilo propia — esta matriz aplica.
      </Text>

      <MatrixRow borderColor={border} label="Predeterminado" metaColor={meta}>
        <IconButton accessibilityLabel="Icono predeterminado">
          <MapPinPlus size={ICON} color={colors.text} />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Seleccionado" caption="Mismo aspecto activo que pressed/hover (web)" metaColor={meta}>
        <IconButton selected accessibilityLabel="Icono seleccionado">
          <Check size={ICON} color={colors.text} />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Cargando" metaColor={meta}>
        <IconButton loading accessibilityLabel="Icono cargando">
          <MapPinPlus size={ICON} color={colors.text} />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Deshabilitado" metaColor={meta}>
        <IconButton disabled accessibilityLabel="Icono deshabilitado">
          <MapPinPlus size={ICON} color={colors.text} />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Variante primary" caption="Fondo tint; icono claro" metaColor={meta}>
        <IconButton variant="primary" accessibilityLabel="Icono primary">
          <MapPinPlus size={ICON} color="#fff" />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Variante savePin — por visitar" metaColor={meta}>
        <IconButton variant="savePin" savePinState="toVisit" accessibilityLabel="Save pin por visitar">
          <MapPin size={ICON} color="#fff" />
        </IconButton>
      </MatrixRow>
      <MatrixRow borderColor={border} label="Variante savePin — visitado" metaColor={meta}>
        <IconButton variant="savePin" savePinState="visited" accessibilityLabel="Save pin visitado">
          <MapPin size={ICON} color="#fff" />
        </IconButton>
      </MatrixRow>
      <MatrixRow
        borderColor={border}
        label="Enfoque teclado (web)"
        caption="Anillo stateFocusRing — prueba Tab"
        metaColor={meta}
      >
        <IconButton accessibilityLabel="Icono enfocable para foco">
          <MapPinPlus size={ICON} color={colors.text} />
        </IconButton>
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
});
