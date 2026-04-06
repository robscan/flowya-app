/**
 * Vitrina DS: composición PNG generada por `shareCountriesCard` / `drawCard` en lib/share-countries-card.
 * Solo web (canvas). Misma geometría que la imagen compartida/descargada.
 */

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getShareCountriesCardPreviewDataUrl } from '@/lib/share-countries-card';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

const SHARE_PREVIEW_ITEMS = [
  { key: 'iso:MX', label: 'México', count: 12 },
  { key: 'iso:ES', label: 'España', count: 8 },
  { key: 'iso:FR', label: 'Francia', count: 6 },
] as const;

export function ShareCountriesCardShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [toVisitUri, setToVisitUri] = useState<string | null>(null);
  const [visitedUri, setVisitedUri] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    const base = {
      countriesCount: 12,
      spotsCount: 48,
      worldPercentage: 18,
      items: [...SHARE_PREVIEW_ITEMS],
    };
    (async () => {
      const [u1, u2] = await Promise.all([
        getShareCountriesCardPreviewDataUrl(
          {
            title: 'Países por visitar',
            ...base,
            accentColor: colors.stateToVisit,
            mapSnapshotDataUrl: null,
          },
          { width: 440 },
        ),
        getShareCountriesCardPreviewDataUrl(
          {
            title: 'Países visitados',
            ...base,
            accentColor: colors.stateSuccess,
            mapSnapshotDataUrl: null,
          },
          { width: 440 },
        ),
      ]);
      if (!cancelled) {
        setToVisitUri(u1);
        setVisitedUri(u2);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [colors.stateSuccess, colors.stateToVisit]);

  if (Platform.OS !== 'web') {
    return (
      <Text style={{ color: colors.textSecondary }}>
        Vista previa de tarjeta de compartir solo en web (canvas).
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.column}>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>Por visitar</Text>
        {toVisitUri ? (
          <Image source={{ uri: toVisitUri }} style={styles.image} resizeMode="contain" accessibilityLabel="Vista previa compartir países por visitar" />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Generando…</Text>
        )}
      </View>
      <View style={styles.column}>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>Visitados</Text>
        {visitedUri ? (
          <Image source={{ uri: visitedUri }} style={styles.image} resizeMode="contain" accessibilityLabel="Vista previa compartir países visitados" />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Generando…</Text>
        )}
      </View>
    </View>
  );
}

const AR = 1600 / 2000;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  column: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 440,
    gap: Spacing.sm,
  },
  caption: {
    fontSize: 13,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    maxWidth: 440,
    aspectRatio: AR,
    borderRadius: 12,
  },
});
