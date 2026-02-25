/**
 * Modal en 2 pasos cuando se detecta spot duplicado.
 * Paso 1: Ver spot existente | Crear otro | Cerrar
 * Paso 2: Confirmación "¿Crear otro spot?" → Sí, crear | Volver
 * Sin botón compartir.
 */

import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Radius, Spacing, WebTouchManipulation } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type DuplicateSpotModalProps = {
  visible: boolean;
  existingTitle: string;
  existingSpotId: string;
  onViewSpot: () => void;
  onCreateAnyway: () => void | Promise<void>;
  onClose: () => void;
};

type Step = 1 | 2;

export function DuplicateSpotModal({
  visible,
  existingTitle,
  existingSpotId,
  onViewSpot,
  onCreateAnyway,
  onClose,
}: DuplicateSpotModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    if (visible) setStep(1);
  }, [visible]);

  if (!visible) return null;

  const handleViewSpot = () => {
    onClose();
    onViewSpot();
  };

  const handleCreateOther = () => {
    setStep(2);
  };

  const handleConfirmCreate = async () => {
    await onCreateAnyway();
    onClose();
  };

  const handleBack = () => {
    setStep(1);
  };

  const isStep1 = step === 1;

  const buttonBase = {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "web" ? "fade" : "slide"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Cerrar"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.backgroundElevated,
              paddingBottom: Platform.OS === "web" ? Spacing.xxl : Spacing.xl + 24,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {isStep1 ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>
                  Spot muy parecido
                </Text>
                <Text
                  style={[styles.message, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  Ya existe &quot;{existingTitle}&quot; cerca de aquí.
                </Text>
                <View style={styles.buttonsColumn}>
                  <Pressable
                    style={({ pressed }) => [
                      buttonBase,
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : colors.primary,
                      },
                      WebTouchManipulation,
                    ]}
                    onPress={handleViewSpot}
                    accessibilityLabel="Ver spot existente"
                  >
                    <Text style={styles.primaryButtonLabel}>
                      Ver spot existente
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      buttonBase,
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                      WebTouchManipulation,
                    ]}
                    onPress={handleCreateOther}
                    accessibilityLabel="Crear otro"
                  >
                    <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>
                      Crear otro
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      buttonBase,
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                      },
                      WebTouchManipulation,
                    ]}
                    onPress={onClose}
                    accessibilityLabel="Cerrar"
                  >
                    <Text style={[styles.tertiaryButtonLabel, { color: colors.textSecondary }]}>
                      Cerrar
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>
                  ¿Crear otro spot?
                </Text>
                <Text
                  style={[styles.message, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  Puede haber duplicados.
                </Text>
                <View style={styles.buttonsColumn}>
                  <Pressable
                    style={({ pressed }) => [
                      buttonBase,
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : colors.primary,
                      },
                      WebTouchManipulation,
                    ]}
                    onPress={handleConfirmCreate}
                    accessibilityLabel="Sí, crear"
                  >
                    <Text style={styles.primaryButtonLabel}>Sí, crear</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      buttonBase,
                      {
                        backgroundColor: pressed ? colors.surfaceMuted : "transparent",
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                      WebTouchManipulation,
                    ]}
                    onPress={handleBack}
                    accessibilityLabel="Volver"
                  >
                    <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>
                      Volver
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.base,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  buttonsColumn: {
    gap: Spacing.sm,
  },
  primaryButtonLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButtonLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  tertiaryButtonLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});
