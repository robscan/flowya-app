/**
 * Modal de confirmación con estilo FLOWYA (mismo formato que Modal de auth).
 * Reemplaza window.confirm / Alert.alert para acciones como cerrar sesión.
 */

import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ConfirmModalVariant = 'default' | 'destructive';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const confirmBg = variant === 'destructive' ? colors.stateError : colors.primary;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityLabel={cancelLabel}
      >
        <View style={styles.centered}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.backgroundElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            ) : null}
            <View style={styles.buttonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
                  },
                  WebTouchManipulation,
                ]}
                onPress={onCancel}
                accessibilityLabel={cancelLabel}
              >
                <Text style={[styles.cancelLabel, { color: colors.text }]}>
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: pressed ? colors.text : confirmBg,
                  },
                  WebTouchManipulation,
                ]}
                onPress={onConfirm}
                accessibilityLabel={confirmLabel}
              >
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  centered: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {},
  cancelLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  confirmLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
