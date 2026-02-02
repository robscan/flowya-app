/**
 * Design System: SpotImage (Scope C).
 * Imagen de portada de spot con estados: loading | image | placeholder | error.
 * Usa placeholder canónico cuando no hay URI o falla la carga.
 */

import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ImagePlaceholder } from './image-placeholder';

export type SpotImageProps = {
  /** URL de la imagen. Si null/undefined → placeholder. */
  uri?: string | null;
  width?: number;
  height?: number;
  /** Esquinas redondeadas (por defecto Radius.md). */
  borderRadius?: number;
  /** Modo compacto para miniatura (ej. 72×40). */
  iconSize?: number;
  /** Al tocar la imagen (solo si hay imagen cargada). */
  onPress?: () => void;
  /** Override color scheme. */
  colorScheme?: 'light' | 'dark';
};

export function SpotImage({
  uri,
  width,
  height = 120,
  borderRadius = Radius.md,
  iconSize = 16,
  onPress,
  colorScheme: colorSchemeOverride,
}: SpotImageProps) {
  const colorScheme = useColorScheme();
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showImage = Boolean(uri) && !error;
  const showPlaceholder = !uri || error;

  const content = showPlaceholder ? (
    <ImagePlaceholder
      width={width}
      height={height}
      borderRadius={borderRadius}
      colorScheme={colorSchemeOverride ?? colorScheme ?? undefined}
      iconSize={iconSize}
    />
  ) : (
    <>
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, styles.loadingWrap]}>
          <ActivityIndicator size="small" />
        </View>
      )}
      <Image
        source={{ uri: uri! }}
        style={[
          width != null && height != null ? { width, height, borderRadius } : { flex: 1, minHeight: height, borderRadius },
        ]}
        contentFit="cover"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );

  const wrapperStyle = [
    styles.wrapper,
    width != null && height != null && { width, height },
    (width == null || height == null) && { flex: 1 },
    { borderRadius },
  ];

  if (onPress && showImage) {
    return (
      <Pressable style={wrapperStyle} onPress={onPress} accessibilityLabel="Ver imagen en grande">
        {content}
      </Pressable>
    );
  }
  return <View style={wrapperStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});
