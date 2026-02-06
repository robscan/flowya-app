/**
 * Scope I: Auth mínima para persistir pins.
 * Modal ligero: email + Magic Link. Sin fricción.
 * La cuenta se pide solo al guardar el primer pin.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

type AuthModalState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Títulos del modal de auth por contexto de apertura.
 * savePin: al intentar guardar pin sin sesión (SpotCard, SpotDetail).
 * profile: al tocar icono de perfil sin sesión.
 */
export const AUTH_MODAL_MESSAGES = {
  savePin: 'Crea una cuenta para guardar tus lugares',
  profile: 'Ingresa a tu cuenta de FLOWYA',
} as const;

type AuthModalContextValue = {
  openAuthModal: (options: { message?: string; onSuccess?: () => void }) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

const POLL_SESSION_INTERVAL_MS = 2000;

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(AUTH_MODAL_MESSAGES.savePin);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<AuthModalState>('idle');
  const [errorText, setErrorText] = useState('');
  const onSuccessRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const closeAuthModal = useCallback(() => {
    setVisible(false);
    setEmail('');
    setState('idle');
    setErrorText('');
    onSuccessRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const openAuthModal = useCallback(
    (options: { message?: string; onSuccess?: () => void } = {}) => {
      setMessage(options.message ?? AUTH_MODAL_MESSAGES.savePin);
      setVisible(true);
      setState('idle');
      setErrorText('');
      setEmail('');
      onSuccessRef.current = options.onSuccess ?? null;
    },
    []
  );

  // Al detectar sesión (mismo tab o sync), ejecutar onSuccess y cerrar
  const runPendingAndClose = useCallback(() => {
    const fn = onSuccessRef.current;
    onSuccessRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    closeAuthModal();
    fn?.();
  }, [closeAuthModal]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && visible) {
        runPendingAndClose();
      }
    });
    return () => subscription.unsubscribe();
  }, [visible, runPendingAndClose]);

  // Mientras mostramos "Revisa tu correo", sondear sesión (por si abrió el enlace en otra pestaña)
  useEffect(() => {
    if (state !== 'success' || !visible) return;
    pollRef.current = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        runPendingAndClose();
      }
    }, POLL_SESSION_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state, visible, runPendingAndClose]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModalView
        visible={visible}
        message={message}
        email={email}
        setEmail={setEmail}
        state={state}
        setState={setState}
        errorText={errorText}
        setErrorText={setErrorText}
        onClose={closeAuthModal}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}

type AuthModalViewProps = {
  visible: boolean;
  message: string;
  email: string;
  setEmail: (v: string) => void;
  state: AuthModalState;
  setState: (s: AuthModalState) => void;
  setErrorText: (t: string) => void;
  errorText: string;
  onClose: () => void;
};

function AuthModalView({
  visible,
  message,
  email,
  setEmail,
  state,
  setState,
  errorText,
  setErrorText,
  onClose,
}: AuthModalViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorText('Escribe tu correo');
      setState('error');
      return;
    }
    setErrorText('');
    setState('loading');
    const origin =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: origin ? { emailRedirectTo: origin } : undefined,
    });
    if (error) {
      setErrorText(error.message || 'Algo falló');
      setState('error');
      return;
    }
    setState('success');
  }, [email]);

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
            {state === 'success' ? (
              <>
                <Text style={[styles.title, { color: colors.text }]}>
                  Revisa tu correo electrónico
                </Text>
                <Text style={[styles.hint, { color: colors.text }]}>
                  Te enviamos un enlace para entrar a FLOWYA. Abre el correo y haz clic en el
                  enlace para continuar.
                </Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
                  Si no lo ves en tu bandeja de entrada, revisa tu carpeta de Spam o Correo no
                  deseado.
                </Text>
                <Text
                  style={[
                    styles.hint,
                    { color: colors.textSecondary, marginTop: Spacing.base },
                  ]}
                >
                  Puedes cerrar esta ventana.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.text }]}>{message}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Recibirás un correo con un enlace para entrar.
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (state === 'error') setState('idle');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={state !== 'loading'}
                  accessibilityLabel="Correo electrónico"
                />
                {errorText ? (
                  <Text style={[styles.error, { color: colors.stateToVisit }]}>
                    {errorText}
                  </Text>
                ) : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.cta,
                    { backgroundColor: colors.primary, opacity: state === 'loading' ? 0.8 : pressed ? 0.9 : 1 },
                  ]}
                  onPress={handleSubmit}
                  disabled={state === 'loading'}
                  accessibilityLabel="Enviar enlace"
                >
                  {state === 'loading' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaLabel}>Enviar enlace</Text>
                  )}
                </Pressable>
              </>
            )}

            <Pressable
              style={[styles.close, { marginTop: state === 'success' ? Spacing.lg : Spacing.base }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 17 }}>Cerrar</Text>
            </Pressable>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: 17,
    marginBottom: Spacing.sm,
  },
  error: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  close: {
    alignSelf: 'center',
  },
});
