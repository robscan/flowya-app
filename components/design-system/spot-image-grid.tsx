/**
 * Grid compacto 2×2 para hero de spot (OL-CONTENT-002).
 * 2 imágenes: una fila; 3+: dos filas; máx. 4 miniaturas visibles, +N en la última si hay más.
 */

import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SpotImageGridProps = {
  uris: string[];
  /** Altura total aproximada del bloque (se reparte entre filas). */
  totalHeight: number;
  onImagePress?: (index: number) => void;
};

const GAP = 8;

export function SpotImageGrid({ uris, totalHeight, onImagePress }: SpotImageGridProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (uris.length === 0) {
    return null;
  }

  if (uris.length === 1) {
    return null;
  }

  const show = uris.slice(0, 4);
  const extra = uris.length - 4;
  const rowH =
    uris.length === 2
      ? totalHeight
      : Math.max(72, (totalHeight - GAP) / 2);

  if (uris.length === 2) {
    return (
      <View style={[styles.row, { height: rowH, gap: GAP }]}>
        {show.slice(0, 2).map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
            onPress={() => onImagePress?.(i)}
            accessibilityLabel={`Imagen ${i + 1} de ${uris.length}`}
            accessibilityRole="button"
          >
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={{ height: totalHeight, gap: GAP }}>
      <View style={[styles.row, { flex: 1, gap: GAP }]}>
        <Pressable
          style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
          onPress={() => onImagePress?.(0)}
          accessibilityLabel={`Imagen 1 de ${uris.length}`}
          accessibilityRole="button"
        >
          <Image source={{ uri: show[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Pressable>
        <Pressable
          style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
          onPress={() => onImagePress?.(1)}
          accessibilityLabel={`Imagen 2 de ${uris.length}`}
          accessibilityRole="button"
        >
          <Image source={{ uri: show[1] }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Pressable>
      </View>
      <View style={[styles.row, { flex: 1, gap: GAP }]}>
        {uris.length === 3 ? (
          <Pressable
            style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
            onPress={() => onImagePress?.(2)}
            accessibilityLabel="Imagen 3"
            accessibilityRole="button"
          >
            <Image source={{ uri: show[2] }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
              onPress={() => onImagePress?.(2)}
              accessibilityLabel="Imagen 3"
              accessibilityRole="button"
            >
              <Image source={{ uri: show[2] }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
            <Pressable
              style={[styles.cell, { flex: 1, borderRadius: Radius.md, overflow: 'hidden' }]}
              onPress={() => onImagePress?.(3)}
              accessibilityLabel={extra > 0 ? `Más imágenes, ${extra} adicionales` : 'Imagen 4'}
              accessibilityRole="button"
            >
              <Image source={{ uri: show[3] }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {extra > 0 ? (
                <View style={[styles.moreBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                  <Text style={[styles.moreText, { color: colors.backgroundElevated }]}>+{extra}</Text>
                </View>
              ) : null}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cell: {
    position: 'relative',
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  moreBadge: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 22,
    fontWeight: '700',
  },
});
