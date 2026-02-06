/**
 * Modal de confirmación antes de entrar a Create Spot (long-press en mapa).
 * Mismo diseño visual del DS (ConfirmModal): backdrop, sheet, título, botones.
 * Incluye checkbox "No volver a mostrar" con persistencia local (responsabilidad del caller).
 */

import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type CreateSpotConfirmModalProps = {
  visible: boolean;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
};

export function CreateSpotConfirmModal({
  visible,
  onConfirm,
  onCancel,
}: CreateSpotConfirmModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
    setDontShowAgain(false);
  };

  const handleCancel = () => {
    setDontShowAgain(false);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleCancel}
        accessibilityLabel="Cancelar"
      >
        <View style={styles.centered}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.backgroundElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              ¿Crear spot aquí?
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              Mantuviste pulsado en el mapa. Puedes crear un nuevo spot en este punto.
            </Text>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setDontShowAgain((v) => !v)}
              accessibilityLabel="No volver a mostrar"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: dontShowAgain }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: dontShowAgain ? colors.primary : 'transparent',
                  },
                ]}
              >
                {dontShowAgain ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                No volver a mostrar
              </Text>
            </Pressable>
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
                onPress={handleCancel}
                accessibilityLabel="Cancelar"
              >
                <Text style={[styles.cancelLabel, { color: colors.text }]}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: pressed ? colors.text : colors.primary,
                  },
                  WebTouchManipulation,
                ]}
                onPress={handleConfirm}
                accessibilityLabel="Crear spot"
              >
                <Text style={styles.confirmLabel}>Crear spot</Text>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxLabel: {
    fontSize: 15,
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
