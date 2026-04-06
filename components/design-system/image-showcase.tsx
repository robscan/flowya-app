/**
 * Vitrina: ImagePlaceholder, SpotImage e ImageFullscreenModal (medios de spot / lightbox).
 */

import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ButtonPrimary } from './buttons';
import { ImageFullscreenModal } from './image-fullscreen-modal';
import { ImagePlaceholder } from './image-placeholder';
import { SpotImage } from './spot-image';

/** Misma foto que el lightbox; una sola demo con cover para no repetir la misma imagen. */
const DEMO_COVER_URI = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400';
const DEMO_FULL_URI = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200';

export function ImagesShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const meta = colors.textSecondary;
  const mono = Platform.OS === 'web' ? ({ fontFamily: 'monospace' } as const) : undefined;
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Text style={[styles.intro, { color: meta }]}>
        Tres piezas relacionadas: <Text style={{ fontWeight: '600', color: colors.text }}>ImagePlaceholder</Text> es el fallback
        visual canónico (sin texto). <Text style={{ fontWeight: '600', color: colors.text }}>SpotImage</Text> envuelve carga con{' '}
        <Text style={{ fontWeight: '600', color: colors.text }}>expo-image</Text> y reutiliza ImagePlaceholder si no hay URI o hay
        error. <Text style={{ fontWeight: '600', color: colors.text }}>ImageFullscreenModal</Text> es el lightbox a pantalla
        completa. Imports:{' '}
        <Text style={mono}>@/components/design-system/image-placeholder</Text>,{' '}
        <Text style={mono}>spot-image</Text>, <Text style={mono}>image-fullscreen-modal</Text>.
      </Text>

      <View>
        <Text style={[styles.blockTitle, { color: colors.text }]}>ImagePlaceholder</Text>
        <Text style={[styles.caption, { color: meta }]}>
          Superficie <Text style={mono}>surfaceMuted</Text> sobre fondo de app (<Text style={mono}>background</Text>); icono
          image-plus. Modo compacto fijo (miniatura) abajo — el marco evita que el gris se confunda con la tarjeta blanca.
        </Text>
        <View style={[styles.demoPad, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
          <View style={styles.row}>
            <ImagePlaceholder width={120} height={120} colorScheme="light" />
            <ImagePlaceholder width={120} height={120} colorScheme="dark" />
          </View>
          <View style={[styles.row, { marginTop: Spacing.sm }]}>
            <ImagePlaceholder width={72} height={40} iconSize={16} borderRadius={Radius.sm} colorScheme="light" />
            <ImagePlaceholder width={72} height={40} iconSize={16} borderRadius={Radius.sm} colorScheme="dark" />
          </View>
        </View>
      </View>

      <View>
        <Text style={[styles.blockTitle, { color: colors.text }]}>SpotImage</Text>
        <Text style={[styles.caption, { color: meta }]}>
          Sin URI (claro / oscuro) reutiliza ImagePlaceholder; con una sola URI de demo → cover + carga hasta{' '}
          <Text style={mono}>onLoad</Text> (sin duplicar la misma foto).
        </Text>
        <View style={[styles.demoPad, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
          <View style={styles.row}>
            <SpotImage uri={null} width={120} height={120} colorScheme="light" />
            <SpotImage uri={null} width={120} height={120} colorScheme="dark" />
            <SpotImage uri={DEMO_COVER_URI} width={120} height={120} colorScheme="light" />
          </View>
        </View>
      </View>

      <View>
        <Text style={[styles.blockTitle, { color: colors.text }]}>ImageFullscreenModal</Text>
        <Text style={[styles.caption, { color: meta }]}>
          Modal oscuro, imagen <Text style={mono}>contain</Text>, cerrar por backdrop o botón.
        </Text>
        <ButtonPrimary accessibilityLabel="Abrir demo lightbox" onPress={() => setFullscreenOpen(true)}>
          Abrir ImageFullscreenModal
        </ButtonPrimary>
        <ImageFullscreenModal
          visible={fullscreenOpen}
          uri={DEMO_FULL_URI}
          onClose={() => setFullscreenOpen(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: Spacing.lg,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  /** Contrasta la tarjeta blanca del DS (#fff) con el gris del placeholder (#e8e8ed). */
  demoPad: {
    alignSelf: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
});
