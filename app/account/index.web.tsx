/**
 * Cuenta / perfil (OL-PROFILE-001) — web.
 * Ruta: /account — desktop: panel lateral; animación de entrada izquierda → derecha.
 */

import { SHEET_HEADER_BUTTON_SIZE } from '@/components/explorar/spot-sheet/SpotSheetHeader';
import { TypographyStyles } from '@/components/design-system/typography';
import { useSystemStatus } from '@/components/ui/system-status-bar';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  deleteMyProfileAvatarObject,
  getProfileAvatarPublicUrl,
  pickProfileImageBlob,
  uploadMyProfileAvatar,
} from '@/lib/profile-avatar-upload';
import {
  fetchMyProfile,
  touchMyProfileLastActivity,
  updateMyProfile,
  type ProfileRow,
} from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { WEB_VIEWPORT_REF } from '@/lib/web-layout';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ImagePlus, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCOUNT_SIDEBAR_WIDTH = 400;
const AVATAR_SIZE = 132;
const ENTRY_DURATION_MS = 320;

export default function AccountScreenWeb() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const toast = useSystemStatus();
  const { openAuthModal } = useAuthModal();

  const isDesktopSidebar =
    Platform.OS === 'web' && windowWidth >= WEB_VIEWPORT_REF.tabletMin;

  const entryX = useRef(new Animated.Value(-28)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    entryX.setValue(-28);
    entryOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(entryX, {
        toValue: 0,
        duration: ENTRY_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: ENTRY_DURATION_MS - 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryX]);

  /** Desktop: modal transparente para ver el mapa (pantalla anterior) a la derecha. */
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isDesktopSidebar) {
      navigation.setOptions({
        presentation: 'transparentModal',
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      });
    } else {
      navigation.setOptions({
        presentation: 'card',
        contentStyle: undefined,
        animation: 'default',
      });
    }
    return () => {
      navigation.setOptions({
        presentation: 'card',
        contentStyle: undefined,
      });
    };
  }, [navigation, isDesktopSidebar]);

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
    await touchMyProfileLastActivity({ bypassThrottle: true });
    const { data, error } = await fetchMyProfile();
    if (error) {
      toast.show(error.message, { type: 'error' });
      setProfile(null);
    } else {
      setProfile(data);
      setDisplayName(data?.display_name?.trim() ?? '');
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const trimmedDisplay = displayName.trim();
  const savedDisplay = profile?.display_name?.trim() ?? '';
  const nameDirty = trimmedDisplay !== savedDisplay;
  const accountEmail = profile?.email?.trim() || userEmail;

  const onSave = useCallback(async () => {
    if (!sessionReady || !nameDirty) return;
    setSaving(true);
    const { data, error } = await updateMyProfile({
      display_name: trimmedDisplay.length > 0 ? trimmedDisplay : null,
    });
    setSaving(false);
    if (error) {
      toast.show(error.message, { type: 'error' });
      return;
    }
    setProfile(data);
    toast.show('Nombre guardado', { type: 'success' });
  }, [sessionReady, nameDirty, trimmedDisplay, toast]);

  const onPickAvatar = useCallback(async () => {
    if (!sessionReady || avatarBusy) return;
    setAvatarBusy(true);
    try {
      const blob = await pickProfileImageBlob();
      if (!blob) return;
      const uploaded = await uploadMyProfileAvatar(blob);
      if (!uploaded) {
        toast.show('No se pudo subir la imagen.', { type: 'error' });
        return;
      }
      const { data, error } = await updateMyProfile({
        avatar_storage_path: uploaded.storagePath,
      });
      if (error) {
        toast.show(error.message, { type: 'error' });
        return;
      }
      setProfile(data);
      toast.show('Foto actualizada', { type: 'success' });
    } catch {
      toast.show('No se pudo completar la selección de imagen.', { type: 'error' });
    } finally {
      setAvatarBusy(false);
    }
  }, [sessionReady, avatarBusy, toast]);

  const onRemoveAvatar = useCallback(async () => {
    if (!sessionReady || avatarBusy || !profile?.avatar_storage_path) return;
    setAvatarBusy(true);
    const previousAvatarPath = profile.avatar_storage_path;
    try {
      // Primero persistimos en DB que ya no hay avatar. Si este paso falla, no borramos
      // el archivo para evitar pérdida irreversible de la imagen anterior.
      const { data, error } = await updateMyProfile({ avatar_storage_path: null });
      if (error) {
        toast.show(error.message, { type: 'error' });
        return;
      }
      setProfile(data);
      const deleted = await deleteMyProfileAvatarObject(previousAvatarPath);
      if (!deleted) {
        toast.show('Foto quitada del perfil, pero no se pudo limpiar el archivo anterior.', {
          type: 'default',
        });
        return;
      }
      toast.show('Foto eliminada', { type: 'success' });
    } finally {
      setAvatarBusy(false);
    }
  }, [sessionReady, avatarBusy, profile?.avatar_storage_path, toast]);

  const onLogout = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.replace('/');
  }, [router]);

  const avatarPublicUrl = getProfileAvatarPublicUrl(profile?.avatar_storage_path ?? null);

  const panelBody = (
    <>
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
          <Text
            style={[TypographyStyles.heading3, { color: colors.text, marginBottom: Spacing.lg, textAlign: 'center' }]}
          >
            Tu cuenta
          </Text>

          {/* Avatar centrado: toque para elegir foto; icono de subir en badge */}
          <View style={styles.avatarBlock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={avatarPublicUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
              disabled={avatarBusy}
              onPress={() => void onPickAvatar()}
              style={({ pressed }) => [
                styles.avatarPressable,
                {
                  opacity: avatarBusy ? 0.75 : pressed ? 0.92 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.avatarClip,
                  {
                    borderColor: colors.border,
                  },
                ]}
              >
                {avatarPublicUrl ? (
                  <Image
                    source={{ uri: avatarPublicUrl }}
                    style={styles.avatarImage}
                    accessibilityLabel="Foto de perfil"
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarImage,
                      styles.avatarPlaceholder,
                      { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <Text style={[TypographyStyles.heading2, { color: colors.textSecondary, fontSize: 44 }]}>
                      {(trimmedDisplay || accountEmail || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.uploadBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                {avatarBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ImagePlus size={20} color="#fff" strokeWidth={2.25} />
                )}
              </View>
            </Pressable>
            {avatarPublicUrl ? (
              <Pressable
                accessibilityRole="button"
                disabled={avatarBusy}
                onPress={() => void onRemoveAvatar()}
                style={({ pressed }) => ({ marginTop: Spacing.sm, opacity: pressed || avatarBusy ? 0.65 : 1 })}
              >
                <Text style={[TypographyStyles.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
                  Eliminar foto
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Listado: correo */}
          {accountEmail ? (
            <View style={[styles.listBlock, { borderColor: colors.borderSubtle }]}>
              <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
                Correo electrónico
              </Text>
              <Text style={[TypographyStyles.body, { color: colors.text }]}>{accountEmail}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: Spacing.lg }}>
            <Text style={[TypographyStyles.caption, { color: colors.textSecondary, marginBottom: Spacing.xs }]}>
              Nombre visible
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ej. Alex"
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
                { color: colors.textSecondary, marginTop: Spacing.sm, lineHeight: 18 },
              ]}
            >
              Es cómo te mostramos en la app.
            </Text>
          </View>

          {nameDirty ? (
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void onSave()}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: saving || pressed ? 0.85 : 1,
                  marginTop: Spacing.lg,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[TypographyStyles.body, { fontWeight: '600', color: '#fff' }]}>
                  Guardar nombre
                </Text>
              )}
            </Pressable>
          ) : null}
        </>
      )}
    </>
  );

  const logoutBar =
    sessionReady && !loading ? (
      <View
        style={[
          styles.logoutBar,
          {
            paddingBottom: insets.bottom + Spacing.md,
            borderTopColor: colors.borderSubtle,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={() => void onLogout()}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              opacity: signingOut || pressed ? 0.8 : 1,
            },
          ]}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.stateError} />
          ) : (
            <Text style={[TypographyStyles.body, { fontWeight: '600', color: colors.stateError }]}>
              Cerrar sesión
            </Text>
          )}
        </Pressable>
      </View>
    ) : null;

  const scrollContent = (
    <View style={[styles.innerColumn, { maxWidth: isDesktopSidebar ? ACCOUNT_SIDEBAR_WIDTH : 520 }]}>
      {panelBody}
    </View>
  );

  const closeBar = (
    <View style={[styles.closeBar, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.closeBarSpacer} />
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeButton, { backgroundColor: colors.borderSubtle }]}
        accessibilityLabel="Cerrar"
        accessibilityRole="button"
      >
        <X size={20} color={colors.text} strokeWidth={2} />
      </Pressable>
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDesktopSidebar ? 'transparent' : colors.background },
      ]}
    >
      {isDesktopSidebar ? (
        <>
          <Animated.View
            style={[
              styles.sidebarPanel,
              {
                width: ACCOUNT_SIDEBAR_WIDTH,
                borderRightColor: colors.borderSubtle,
                backgroundColor: colors.background,
                transform: [{ translateX: entryX }],
                opacity: entryOpacity,
              },
            ]}
          >
            <View style={styles.sidebarInner}>
              {closeBar}
              <ScrollView
                style={styles.scrollFlex}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {scrollContent}
              </ScrollView>
              {logoutBar}
            </View>
          </Animated.View>
          <View
            style={[styles.desktopRest, { backgroundColor: 'transparent' }]}
            pointerEvents="none"
            aria-hidden={true}
          />
        </>
      ) : (
        <Animated.View
          style={[
            styles.mobilePanel,
            {
              flex: 1,
              backgroundColor: colors.background,
              transform: [{ translateX: entryX }],
              opacity: entryOpacity,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            {closeBar}
            <ScrollView
              style={styles.scrollFlex}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom: Spacing.xl,
                  paddingHorizontal: Spacing.lg,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              accessibilityLabel="Cuenta"
            >
              {scrollContent}
            </ScrollView>
            {logoutBar}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    minHeight: '100%',
  },
  sidebarPanel: {
    alignSelf: 'stretch',
    borderRightWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  sidebarInner: {
    flex: 1,
    flexDirection: 'column',
  },
  closeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingBottom: 4,
  },
  closeBarSpacer: {
    flex: 1,
  },
  /** Misma geometría que `SpotSheetHeader` → `closeButton`. */
  closeButton: {
    width: SHEET_HEADER_BUTTON_SIZE,
    height: SHEET_HEADER_BUTTON_SIZE,
    borderRadius: SHEET_HEADER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopRest: {
    flex: 1,
    minWidth: 0,
  },
  mobilePanel: {
    alignSelf: 'stretch',
    width: '100%',
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  innerColumn: {
    width: '100%',
  },
  centered: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  block: { marginTop: Spacing.md },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPressable: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatarClip: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  listBlock: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  logoutBar: {
    paddingTop: Spacing.xxl + Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: Spacing.sm,
  },
});
