/**
 * Design System: ImageFullscreenModal (Scope C).
 * Lightbox simple: imagen a pantalla completa con cerrar.
 * Compatible con web (RNW).
 */

import { Image } from 'expo-image';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { Colors } from '@/constants/theme';

export type ImageFullscreenModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

export function ImageFullscreenModal({ visible, uri, onClose }: ImageFullscreenModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar">
        <View style={[styles.container, { pointerEvents: 'box-none' }]}>
          {uri ? (
            <Pressable style={styles.imageWrap} onPress={onClose}>
              <Image source={{ uri }} style={styles.image} contentFit="contain" />
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.backgroundElevated }]}
            onPress={onClose}
            accessibilityLabel="Cerrar"
          >
            <Text style={[styles.closeLabel, { color: colors.text }]}>Cerrar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
