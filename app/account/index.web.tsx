/**
 * Cuenta / perfil (OL-PROFILE-001) — web.
 * Ruta: /account
 */

import { TypographyStyles } from '@/components/design-system/typography';
import { useSystemStatus } from '@/components/ui/system-status-bar';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchMyProfile, updateMyProfile, type ProfileRow } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreenWeb() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) {
      setUserEmail(null);
      setProfile(null);
      setSessionReady(false);
      setLoading(false);
      return;
    }
    setSessionReady(true);
    setUserEmail(user.email ?? null);
    const { data, error } = await fetchMyProfile();
    if (error) {
      toast.show(error.message, { type: 'error' });
      setProfile(null);
    } else {
      setProfile(data);
      setDisplayName(data?.display_name?.trim() ?? '');
      setAvatarUrl(data?.avatar_url?.trim() ?? '');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = useCallback(async () => {
    if (!sessionReady) return;
    setSaving(true);
    const trimmedName = displayName.trim();
    const trimmedAvatar = avatarUrl.trim();
    const { data, error } = await updateMyProfile({
      display_name: trimmedName.length > 0 ? trimmedName : null,
      avatar_url: trimmedAvatar.length > 0 ? trimmedAvatar : null,
    });
    setSaving(false);
    if (error) {
      toast.show(error.message, { type: 'error' });
      return;
    }
    setProfile(data);
    toast.show('Cambios guardados', { type: 'success' });
  }, [sessionReady, displayName, avatarUrl, toast]);

  const onLogout = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.replace('/');
  }, [router]);

  const avatarUri =
    profile?.avatar_url?.trim() ||
    (avatarUrl.trim().length > 0 ? avatarUrl.trim() : null);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.xxl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Cuenta"
    >
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !sessionReady ? (
        <View style={styles.block}>
          <Text style={[TypographyStyles.body, { color: colors.textSecondary }]}>
            Inicia sesión para ver y editar tu cuenta.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              openAuthModal({
                message: AUTH_MODAL_MESSAGES.profile,
                onSuccess: () => void load(),
              })
            }
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[TypographyStyles.body, { fontWeight: '600', color: '#fff' }]}>
              Iniciar sesión
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={[TypographyStyles.body, { color: colors.primary, marginTop: Spacing.md }]}>
              Volver
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[TypographyStyles.heading3, { color: colors.text, marginBottom: Spacing.sm }]}>
            Tu cuenta
          </Text>
          {userEmail ? (
            <Text
              style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.lg }]}
            >
              {userEmail}
            </Text>
          ) : null}

          <View style={[styles.avatarRow, { marginBottom: Spacing.lg }]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatar, { borderColor: colors.border }]}
                accessibilityLabel="Avatar"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text style={[TypographyStyles.heading2, { color: colors.textSecondary }]}>
                  {(displayName || userEmail || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
            Nombre visible
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Cómo te mostramos en la app"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.backgroundElevated,
              },
            ]}
            autoCapitalize="words"
            autoCorrect
            accessibilityLabel="Nombre visible"
          />

          <Text
            style={[
              TypographyStyles.caption,
              { color: colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xs },
            ]}
          >
            URL del avatar (opcional)
          </Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://…"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.backgroundElevated,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="URL del avatar"
          />

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void onSave()}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: saving || pressed ? 0.85 : 1, marginTop: Spacing.lg },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[TypographyStyles.body, { fontWeight: '600', color: '#fff' }]}>Guardar</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            onPress={() => void onLogout()}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: colors.border,
                opacity: signingOut || pressed ? 0.75 : 1,
                marginTop: Spacing.md,
              },
            ]}
          >
            <Text style={[TypographyStyles.body, { fontWeight: '600', color: colors.text }]}>
              Cerrar sesión
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  block: { marginTop: Spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
});
