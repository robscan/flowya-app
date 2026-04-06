/**
 * Design System: Typography.
 * Jerarquía clara: títulos, cuerpo, metadata. Moderna y legible.
 * Vitrina: cada token muestra nombre, fuente, peso/estilo, tamaño e interlineado.
 */

import { Platform, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TypoTokenKey = keyof typeof typographyStylesFlat;

/** Misma definición que antes; nombre separado para poder tipar claves en la vitrina. */
const typographyStylesFlat = StyleSheet.create({
  heading1: {
    fontFamily: Fonts.sans,
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  heading2: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  heading3: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  /** Apple Maps style: labels de filtro (más grande y delgado). */
  filterLabel: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '300',
    lineHeight: 22,
  },
});

/** Estilos canónicos para uso en otros componentes (alias estable). */
export const TypographyStyles = typographyStylesFlat;

const TYPO_ORDER: TypoTokenKey[] = ['heading1', 'heading2', 'heading3', 'body', 'caption', 'filterLabel'];

const TYPO_SAMPLES: Record<TypoTokenKey, string> = {
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  body: 'Body — párrafos y contenido por defecto. Interlineado pensado para lectura.',
  caption: 'Caption o metadatos',
  filterLabel: 'Etiqueta de filtro (estilo Apple Maps)',
};

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function describeWeight(w: string | number | undefined): string {
  const s = w == null ? '' : String(w);
  const map: Record<string, string> = {
    '100': '100 (Thin)',
    '200': '200 (Extralight)',
    '300': '300 (Light)',
    '400': '400 (Regular)',
    '500': '500 (Medium)',
    '600': '600 (Semibold)',
    '700': '700 (Bold)',
  };
  return (map[s] ?? s) || '—';
}

function TypoTokenBlock({
  tokenKey,
  textColor,
  metaColor,
  borderBottomColor,
  showDivider,
}: {
  tokenKey: TypoTokenKey;
  textColor: string;
  metaColor: string;
  borderBottomColor: string;
  showDivider: boolean;
}) {
  const s = TypographyStyles[tokenKey] as TextStyle;
  const fontFamily = typeof s.fontFamily === 'string' ? s.fontFamily : String(s.fontFamily ?? '—');
  const fontSize = s.fontSize ?? '—';
  const lineHeight = s.lineHeight ?? '—';
  const weight = describeWeight(s.fontWeight as string | undefined);
  const ls = s.letterSpacing;
  const letterSpacingExtra =
    ls != null && ls !== 0 ? ` · letterSpacing ${String(ls)}` : '';

  return (
    <View
      style={[
        styles.tokenBlock,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderBottomColor,
          paddingBottom: Spacing.base,
        },
        !showDivider && { paddingBottom: 0 },
      ]}
    >
      <Text style={[s, { color: textColor }]}>{TYPO_SAMPLES[tokenKey]}</Text>
      <View style={styles.metaBlock}>
        <Text style={[styles.metaLine, { color: metaColor }]}>
          <Text style={styles.metaLabel}>Token: </Text>
          <Text style={[styles.metaCode, { color: metaColor }]} selectable>
            TypographyStyles.{tokenKey}
          </Text>
        </Text>
        <Text style={[styles.metaLine, { color: metaColor }]} selectable>
          <Text style={styles.metaLabel}>Tipo de letra: </Text>
          {fontFamily}
        </Text>
        <Text style={[styles.metaLine, { color: metaColor }]} selectable>
          <Text style={styles.metaLabel}>Estilo: </Text>
          peso {weight}
          {letterSpacingExtra}
        </Text>
        <Text style={[styles.metaLine, { color: metaColor }]} selectable>
          <Text style={styles.metaLabel}>Tamaño: </Text>
          {fontSize}px
        </Text>
        <Text style={[styles.metaLine, { color: metaColor }]} selectable>
          <Text style={styles.metaLabel}>Interlineado: </Text>
          {lineHeight}px
        </Text>
      </View>
    </View>
  );
}

export function TypographyShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.lede, { color: colors.textSecondary }]}>
        Fuente base: <Text style={{ fontFamily: MONO }}>Fonts.sans</Text> en{' '}
        <Text style={{ fontFamily: MONO }}>constants/theme.ts</Text>. Estilos reutilizables:{' '}
        <Text style={{ fontFamily: MONO }}>TypographyStyles.*</Text> en este archivo.
      </Text>
      {TYPO_ORDER.map((key, index) => (
        <TypoTokenBlock
          key={key}
          tokenKey={key}
          textColor={key === 'caption' ? colors.textSecondary : colors.text}
          metaColor={colors.textSecondary}
          borderBottomColor={colors.borderSubtle}
          showDivider={index < TYPO_ORDER.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.lg,
  },
  lede: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: -Spacing.xs,
  },
  tokenBlock: {
    gap: Spacing.sm,
  },
  metaBlock: {
    gap: 4,
  },
  metaLine: {
    fontSize: 11,
    lineHeight: 16,
  },
  metaLabel: {
    fontWeight: '600',
  },
  metaCode: {
    fontFamily: MONO,
    fontSize: 11,
  },
});
