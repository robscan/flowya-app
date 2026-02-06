/**
 * Design System: ImagePlaceholder (canónico).
 * Fallback global cuando no hay imagen o falla la carga.
 * Hero, cards, listas. Paleta global, ícono image-plus, sin texto.
 * Con width+height: modo compacto (ej. miniatura 72×40), sin padding, no desborda.
 */

import { ImagePlus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ICON_SIZE = 32;

export type ImagePlaceholderProps = {
  /** Ancho (opcional). Con height: tamaño fijo. Sin: flex. */
  width?: number;
  /** Alto (opcional). Por defecto mínimo 120. */
  height?: number;
  /** Si true: width fijo, height 100%, icono centrado. Para SpotCardMapSelection. */
  fillHeight?: boolean;
  /** Esquinas redondeadas (por defecto Radius.md). */
  borderRadius?: number;
  /** Override de color scheme para showcase. */
  colorScheme?: 'light' | 'dark';
  /** Tamaño del ícono SVG (por defecto 32). Ej. 16 para miniaturas. */
  iconSize?: number;
};

export function ImagePlaceholder({
  width,
  height = 120,
  fillHeight = false,
  borderRadius = Radius.md,
  colorScheme: colorSchemeOverride,
  iconSize: iconSizeProp,
}: ImagePlaceholderProps = {}) {
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const bg = colors.surfaceMuted ?? colors.border;
  const iconSize = iconSizeProp ?? ICON_SIZE;

  const isCompact = !fillHeight && width != null && height != null;
  const isFillHeight = fillHeight && width != null;
  const rootStyle = isFillHeight
    ? [
        styles.fillHeightRoot,
        {
          width,
          backgroundColor: bg,
          borderRadius,
        },
      ]
    : isCompact
      ? [
          styles.compactRoot,
          {
            width,
            height,
            minHeight: height,
            backgroundColor: bg,
            borderRadius,
          },
        ]
      : [
          styles.placeholder,
          {
            backgroundColor: bg,
            borderRadius,
            minHeight: height,
            height,
            ...(width != null && { width }),
          },
        ];

  return (
    <View style={rootStyle}>
      <View style={[styles.iconWrapper, { width: iconSize, height: iconSize }]}>
        <ImagePlus
          size={iconSize}
          color={colors.textSecondary}
          strokeWidth={1.5}
          style={{ width: iconSize, height: iconSize }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  fillHeightRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compactRoot: {
    overflow: 'hidden',
    padding: 0,
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSize: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
