/**
 * Modal canónico FLOWYA Beta + Feedback.
 * Reutiliza estructura, overlay y animación del modal de Auth.
 */

import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { ButtonSecondary } from '@/components/design-system/buttons';
import { TypographyStyles } from '@/components/design-system/typography';
import { useToast } from '@/components/ui/toast';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sendFeedback } from '@/lib/send-feedback';
import { supabase } from '@/lib/supabase';

export type FlowyaBetaModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function FlowyaBetaModal({
  visible,
  onClose,
}: FlowyaBetaModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const toast = useToast();
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = feedback.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const result = await sendFeedback({
        message: trimmed,
        user_id: user?.id,
        user_email: user?.email ?? undefined,
      });
      if (result.ok) {
        setFeedback('');
        onClose();
        toast.show('¡Gracias! Lo leemos con cariño.', { type: 'success' });
      } else {
        toast.show('No se pudo enviar ahora');
      }
    } catch {
      toast.show('No se pudo enviar ahora');
    } finally {
      setSending(false);
    }
  }, [feedback, onClose, toast]);

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.backgroundElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[TypographyStyles.heading2, { color: colors.text }]}>
              FLOWYA (beta)
            </Text>

            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Estamos construyendo algo nuevo. Tu opinión importa.
            </Text>

            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Oscar Muñiz Blanco — @robscan
            </Text>

            <View style={[styles.separator, { backgroundColor: colors.borderSubtle }]} />

            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Cuéntanos qué piensas, qué falta, qué mejorar…"
              placeholderTextColor={colors.textSecondary}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              editable={!sending}
              accessibilityLabel="Feedback"
            />

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor:
                      sending || !feedback.trim()
                        ? colors.border
                        : pressed
                          ? colors.text
                          : colors.primary,
                  },
                  WebTouchManipulation,
                ]}
                onPress={handleSubmit}
                disabled={sending || !feedback.trim()}
                accessibilityLabel="Enviar feedback"
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitLabel}>Enviar feedback</Text>
                )}
              </Pressable>
              <ButtonSecondary onPress={onClose} accessibilityLabel="Cerrar">
                Cerrar
              </ButtonSecondary>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
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
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.base,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 17,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  footer: {
    gap: Spacing.sm,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  submitLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
