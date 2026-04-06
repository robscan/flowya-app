/**
 * Modal «Niveles de exploración» (backdrop + tarjeta + lista canónica).
 */

import type { TravelerLevel } from '@/lib/traveler-levels';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { WEB_MODAL_CARD_MAX_WIDTH } from '@/lib/web-layout';

import { TravelerLevelsList } from './traveler-levels-list';

export type TravelerLevelsModalColors = {
  text: string;
  textSecondary: string;
  background: string;
  backgroundElevated: string;
  borderSubtle: string;
};

export type TravelerLevelsModalProps = {
  visible: boolean;
  onClose: () => void;
  currentLevel: TravelerLevel;
  colors: TravelerLevelsModalColors;
};

export function TravelerLevelsModal({ visible, onClose, currentLevel, colors }: TravelerLevelsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Niveles de exploración</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.background },
                pressed ? styles.closeButtonPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar niveles de exploración"
            >
              <X size={20} color={colors.text} strokeWidth={2.2} />
            </Pressable>
          </View>
          <TravelerLevelsList
            currentLevel={currentLevel}
            colors={{
              text: colors.text,
              textSecondary: colors.textSecondary,
              rowCurrentBackground: colors.background,
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  dismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  card: {
    width: '100%',
    maxWidth: WEB_MODAL_CARD_MAX_WIDTH,
    maxHeight: '72%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.72,
  },
});
