/**
 * Wizard Create Spot (Scope A + C): 1 petición por pantalla.
 * Flujo: Ubicación → Título → Descripción corta → Descripción larga → Imagen → Revisión / Crear.
 */

import { ImagePlaceholder } from '@/components/design-system/image-placeholder';
import {
    MapLocationPicker,
    type MapLocationPickerResult,
} from '@/components/design-system/map-location-picker';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blurActiveElement } from '@/lib/focus-management';
import { checkDuplicateSpot } from '@/lib/spot-duplicate-check';
import { optimizeSpotImage } from '@/lib/spot-image-optimize';
import { uploadSpotCover } from '@/lib/spot-image-upload';
import { supabase } from '@/lib/supabase';
import { HeaderBackButton, type HeaderBackButtonProps } from '@react-navigation/elements';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function CreateSpotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    lat?: string;
    lng?: string;
    from?: string;
    source?: string;
    mapLng?: string;
    mapLat?: string;
    mapZoom?: string;
    mapBearing?: string;
    mapPitch?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  /** B2-MS5a: Params leídos una sola vez al montar; después se ignoran. */
  const initialParamsRef = useRef<{
    name: string;
    lat?: number;
    lng?: number;
    mapLng?: number;
    mapLat?: number;
    mapZoom?: number;
    mapBearing?: number;
    mapPitch?: number;
  } | null>(null);
  if (initialParamsRef.current === null) {
    const lat =
      params.lat != null && params.lng != null
        ? (() => {
            const n = Number.parseFloat(params.lat!);
            return Number.isFinite(n) ? n : undefined;
          })()
        : undefined;
    const lng =
      params.lat != null && params.lng != null
        ? (() => {
            const n = Number.parseFloat(params.lng!);
            return Number.isFinite(n) ? n : undefined;
          })()
        : undefined;
    const hasMapView =
      params.mapLng != null && params.mapLat != null && params.mapZoom != null;
    const mapLng = hasMapView ? Number.parseFloat(params.mapLng!) : NaN;
    const mapLat = hasMapView ? Number.parseFloat(params.mapLat!) : NaN;
    const mapZoom = hasMapView ? Number.parseFloat(params.mapZoom!) : NaN;
    initialParamsRef.current = {
      name: params.name != null ? String(params.name) : '',
      lat,
      lng,
      mapLng: hasMapView && Number.isFinite(mapLng) ? mapLng : undefined,
      mapLat: hasMapView && Number.isFinite(mapLat) ? mapLat : undefined,
      mapZoom: hasMapView && Number.isFinite(mapZoom) ? mapZoom : undefined,
      mapBearing:
        params.mapBearing != null && Number.isFinite(Number.parseFloat(params.mapBearing))
          ? Number.parseFloat(params.mapBearing)
          : undefined,
      mapPitch:
        params.mapPitch != null && Number.isFinite(Number.parseFloat(params.mapPitch))
          ? Number.parseFloat(params.mapPitch)
          : undefined,
    };
  }
  const initial = initialParamsRef.current;

  const initialLatitude = initial.lat;
  const initialLongitude = initial.lng;
  const initialViewLongitude = initial.mapLng;
  const initialViewLatitude = initial.mapLat;
  const initialViewZoom = initial.mapZoom;
  const initialViewBearing = initial.mapBearing;
  const initialViewPitch = initial.mapPitch;
  const preserveView =
    initialLatitude != null &&
    initialLongitude != null &&
    initialViewLongitude != null &&
    initialViewLatitude != null &&
    initialViewZoom != null;

  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState<MapLocationPickerResult | null>(null);
  const [title, setTitle] = useState(initial.name);
  const [descriptionShort, setDescriptionShort] = useState('');
  const [descriptionLong, setDescriptionLong] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** URI local de la imagen de portada seleccionada (step 5). */
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);
  /** Foco en el botón principal del paso actual (para estilo focus-visible en web). */
  const [wizardButtonFocused, setWizardButtonFocused] = useState(false);
  /** Comprobación de duplicado al pasar de paso 2 a 3. */
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  /** Banner persistente cuando se detecta duplicado (no modal; usuario actúa). */
  const [duplicateAlert, setDuplicateAlert] = useState<{
    existingTitle: string;
    existingSpotId: string;
  } | null>(null);

  const insets = useSafeAreaInsets();
  /** En web: altura del teclado (Visual Viewport) para que la barra de botones quede siempre visible. */
  const [keyboardHeightWeb, setKeyboardHeightWeb] = useState(0);
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const update = () =>
      setKeyboardHeightWeb(Math.max(0, window.innerHeight - vv.height));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const handleLocationConfirm = useCallback((result: MapLocationPickerResult) => {
    blurActiveElement();
    setLocation(result);
    setStep(2);
  }, []);

  const handleNext = useCallback(() => {
    setError(null);
    blurActiveElement();
    if (step < 6) setStep((s) => (s + 1) as Step);
  }, [step]);

  /** Al pasar de "¿Cómo se llama?" (paso 2) a "Descríbelo en una frase" (paso 3): revisar duplicado y mostrar alerta en paso 3 si aplica. */
  const handleNextFromStep2 = useCallback(async () => {
    if (!location) return;
    setError(null);
    blurActiveElement();
    const titleToUse = title.trim() || 'Sin título';
    setCheckingDuplicate(true);
    const duplicateResult = await checkDuplicateSpot(
      titleToUse,
      location.latitude,
      location.longitude,
      150
    );
    setCheckingDuplicate(false);
    if (duplicateResult.duplicate) {
      setDuplicateAlert({
        existingTitle: duplicateResult.existingTitle,
        existingSpotId: duplicateResult.existingSpotId,
      });
    } else {
      setDuplicateAlert(null);
    }
    setStep(3);
  }, [location, title]);

  const handleCreate = useCallback(async () => {
    if (!location) return;
    setSubmitting(true);
    setError(null);

    const titleToUse = title.trim() || 'Sin título';
    const duplicateResult = await checkDuplicateSpot(
      titleToUse,
      location.latitude,
      location.longitude,
      150
    );
    if (duplicateResult.duplicate) {
      setSubmitting(false);
      setDuplicateAlert({
        existingTitle: duplicateResult.existingTitle,
        existingSpotId: duplicateResult.existingSpotId,
      });
      return;
    }

    const { data, error: insertError } = await supabase
      .from('spots')
      .insert({
        title: titleToUse,
        description_short: descriptionShort.trim() || null,
        description_long: descriptionLong.trim() || null,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      })
      .select('id')
      .single();
    if (insertError) {
      setSubmitting(false);
      setError(insertError.message ?? 'Error al crear');
      return;
    }
    const newId = data?.id;
    if (!newId) {
      setSubmitting(false);
      router.replace('/(tabs)');
      return;
    }
    if (selectedCoverUri) {
      try {
        const res = await fetch(selectedCoverUri);
        if (res.ok) {
          const blob = await res.blob();
          const optimized = await optimizeSpotImage(blob);
          const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
          if (toUpload) {
            const url = await uploadSpotCover(newId, toUpload);
            if (url) {
              await supabase
                .from('spots')
                .update({ cover_image_url: url })
                .eq('id', newId);
            }
          }
        }
      } catch {
        // Fallback silencioso: spot ya creado, cover_image_url queda null. No mostrar errores al usuario.
      }
    }
    setSubmitting(false);
    router.replace(`/(tabs)?created=${newId}`);
  }, [location, title, descriptionShort, descriptionLong, selectedCoverUri, router]);

  const handlePickCover = useCallback(async () => {
    blurActiveElement();
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedCoverUri(result.assets[0].uri);
      }
    } catch {
      // Fallback silencioso: no bloquear flujo
    }
  }, []);

  const handleRemoveCover = useCallback(() => {
    setSelectedCoverUri(null);
  }, []);

  /** Navegación "Atrás" centralizada: step 1 → sale del flujo; step 2–6 → paso anterior. */
  const handleBack = useCallback(() => {
    if (step === 1) {
      router.back();
    } else {
      blurActiveElement();
      setStep((s) => (s - 1) as Step);
    }
  }, [step, router]);

  /** Cerrar flujo y volver al mapa (botón X del header). */
  const handleClose = useCallback(() => {
    blurActiveElement();
    (router.replace as (href: string) => void)('/(tabs)');
  }, [router]);

  const canNextStep2 = title.trim().length > 0;
  const navigation = useNavigation();

  /** Estilo de foco para botones del wizard (web): sin outline nativo, anillo sutil alineado con tint. */
  const wizardPrimaryButtonFocusStyle =
    Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineStyle: 'none' as const,
          ...(wizardButtonFocused && {
            boxShadow:
              colorScheme === 'dark'
                ? '0 0 0 2px rgba(41,151,255,0.35)'
                : '0 0 0 2px rgba(0,113,227,0.35)',
          }),
        }
      : {};

  useEffect(() => {
    const title =
      step === 1
        ? 'Selecciona la ubicación del spot'
        : step === 2
          ? '¿Cómo se llama este lugar?'
          : step === 3
            ? 'Descríbelo en una frase'
            : step === 4
              ? 'Cuéntanos un poco más del lugar'
              : step === 5
                ? 'Foto de portada'
                : 'Revisa la información del spot';
    navigation.setOptions({
      title,
      headerTitleAlign: 'center',
      headerLeft:
        step === 1
          ? () => null
          : (props: HeaderBackButtonProps) => (
              <HeaderBackButton {...props} onPress={handleBack} />
            ),
      headerRight: () => (
        <Pressable
          onPress={handleClose}
          style={styles.headerCloseTouchable}
          hitSlop={12}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        >
          <X size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
      ),
    });
  }, [step, navigation, handleBack, handleClose, colors.text]);

  const goToExistingSpot = useCallback(() => {
    if (!duplicateAlert) return;
    const spotId = duplicateAlert.existingSpotId;
    setDuplicateAlert(null);
    (router.replace as (href: string) => void)(`/spot/${spotId}`);
  }, [duplicateAlert, router]);

  return (
    <>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.flex}>
            {duplicateAlert ? (
              <View
                style={[
                  styles.duplicateBannerBelowHeader,
                  {
                    backgroundColor: colors.backgroundElevated,
                    borderBottomColor: colors.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.duplicateBannerTitle, { color: colors.text }]}>
                  Este lugar ya existe en el mapa
                </Text>
                <Text style={[styles.duplicateBannerMessage, { color: colors.textSecondary }]}>
                  Parece que alguien ya lo agregó
                </Text>
                <Pressable
                  style={[styles.duplicateBannerButtonPrimary, { backgroundColor: colors.tint }]}
                  onPress={goToExistingSpot}
                  accessibilityLabel="Ir al spot"
                  accessibilityRole="button"
                >
                  <Text style={[styles.duplicateBannerButtonLabel, { color: colors.background }]}>
                    Ir al spot
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {step === 1 && (
              <View style={styles.stepFull}>
                <MapLocationPicker
                  onConfirm={handleLocationConfirm}
                  spotTitle={title.trim() || undefined}
                  initialLatitude={initialLatitude}
                  initialLongitude={initialLongitude}
                  {...(preserveView
                    ? {
                        initialViewLongitude,
                        initialViewLatitude,
                        initialViewZoom,
                        initialViewBearing,
                        initialViewPitch,
                      }
                    : {})}
                />
              </View>
            )}

            {step === 2 && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.flex, styles.stepWithFixedBar]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContentWithBar, styles.scrollContentAboveFixedBar]}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Playa Mamitas"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.borderSubtle },
                ]}
                autoFocus
                maxLength={200}
              />
              {error ? <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text> : null}
            </ScrollView>
            <View
              style={[
                styles.wizardButtonBarFixed,
                {
                  bottom: keyboardHeightWeb,
                  paddingBottom: Math.max(insets.bottom, Spacing.base),
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor:
                      !canNextStep2 || checkingDuplicate
                        ? colors.border
                        : pressed
                          ? colors.text
                          : colors.tint,
                  },
                  (!canNextStep2 || checkingDuplicate) && styles.primaryButtonDisabled,
                  wizardPrimaryButtonFocusStyle,
                  WebTouchManipulation,
                ]}
                onPress={handleNextFromStep2}
                onFocus={() => setWizardButtonFocused(true)}
                onBlur={() => setWizardButtonFocused(false)}
                disabled={!canNextStep2 || checkingDuplicate}
                accessibilityLabel="Siguiente"
              >
                {checkingDuplicate ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.primaryButtonLabel, { color: colors.background }]}>
                    Siguiente
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 3 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, styles.stepWithFixedBar]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContentWithBar, styles.scrollContentAboveFixedBar]}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                value={descriptionShort}
                onChangeText={setDescriptionShort}
                placeholder="Una frase que describa el lugar"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.inputMultiline, { color: colors.text, borderColor: colors.borderSubtle }]}
                multiline
                numberOfLines={3}
                maxLength={500}
                autoFocus
              />
              {error ? <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text> : null}
            </ScrollView>
            <View
              style={[
                styles.wizardButtonBarFixed,
                {
                  bottom: keyboardHeightWeb,
                  paddingBottom: Math.max(insets.bottom, Spacing.base),
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: pressed ? colors.text : colors.tint,
                  },
                  wizardPrimaryButtonFocusStyle,
                  WebTouchManipulation,
                ]}
                onPress={handleNext}
                onFocus={() => setWizardButtonFocused(true)}
                onBlur={() => setWizardButtonFocused(false)}
                accessibilityLabel="Siguiente"
              >
                <Text style={[styles.primaryButtonLabel, { color: colors.background }]}>
                  Siguiente
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 4 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, styles.stepWithFixedBar]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContentWithBar, styles.scrollContentAboveFixedBar]}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                value={descriptionLong}
                onChangeText={setDescriptionLong}
                placeholder="Qué hace especial a este lugar…"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.inputMultiline, { color: colors.text, borderColor: colors.borderSubtle }]}
                multiline
                numberOfLines={5}
                maxLength={2000}
                autoFocus
              />
              {error ? <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text> : null}
            </ScrollView>
            <View
              style={[
                styles.wizardButtonBarFixed,
                {
                  bottom: keyboardHeightWeb,
                  paddingBottom: Math.max(insets.bottom, Spacing.base),
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? colors.text : colors.tint },
                  wizardPrimaryButtonFocusStyle,
                  WebTouchManipulation,
                ]}
                onPress={handleNext}
                onFocus={() => setWizardButtonFocused(true)}
                onBlur={() => setWizardButtonFocused(false)}
                accessibilityLabel="Siguiente"
              >
                <Text style={[styles.primaryButtonLabel, { color: colors.background }]}>
                  Siguiente
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 5 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, styles.stepWithFixedBar]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContentWithBar, styles.scrollContentAboveFixedBar]}
            >
              <View style={styles.stepImageOnly}>
                {selectedCoverUri ? (
                  <View style={styles.coverPreviewWrap}>
                    <Image
                      source={{ uri: selectedCoverUri }}
                      style={styles.coverPreview}
                      contentFit="cover"
                    />
                    <Pressable
                      style={[styles.coverRemoveBtn, { backgroundColor: colors.borderSubtle }]}
                      onPress={handleRemoveCover}
                      accessibilityLabel="Quitar foto"
                    >
                      <Text style={[styles.coverRemoveLabel, { color: colors.text }]}>Quitar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.coverAddWrapLarge, { borderColor: colors.borderSubtle }]}
                    onPress={handlePickCover}
                    accessibilityLabel="Agregar foto"
                  >
                    <ImagePlaceholder
                      width={200}
                      height={100}
                      borderRadius={Radius.md}
                      colorScheme={colorScheme ?? undefined}
                      iconSize={32}
                    />
                    <Text style={[styles.coverAddLabelLarge, { color: colors.textSecondary }]}>
                      Agregar foto
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
            <View
              style={[
                styles.wizardButtonBarFixed,
                {
                  bottom: keyboardHeightWeb,
                  paddingBottom: Math.max(insets.bottom, Spacing.base),
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: pressed ? colors.text : colors.tint },
                  wizardPrimaryButtonFocusStyle,
                  WebTouchManipulation,
                ]}
                onPress={handleNext}
                onFocus={() => setWizardButtonFocused(true)}
                onBlur={() => setWizardButtonFocused(false)}
                accessibilityLabel="Siguiente"
              >
                <Text style={[styles.primaryButtonLabel, { color: colors.background }]}>
                  Siguiente
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 6 && (
          <View style={[styles.step6Wrap, styles.stepWithFixedBar]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContentWithBar, styles.scrollContentAboveFixedBar]}
            >
              <View style={[styles.summaryBlock, { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>{title.trim() || 'Sin título'}</Text>
                {location?.address ? (
                  <Text style={[styles.summaryAddress, { color: colors.textSecondary }]}>{location.address}</Text>
                ) : null}
                <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                  Foto de portada: {selectedCoverUri ? 'Sí' : 'No'}
                </Text>
              </View>
              {error ? <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text> : null}
            </ScrollView>
            <View
              style={[
                styles.wizardButtonBarFixed,
                {
                  bottom: keyboardHeightWeb,
                  paddingBottom: Math.max(insets.bottom, Spacing.base),
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: submitting ? colors.border : pressed ? colors.text : colors.tint,
                  },
                  wizardPrimaryButtonFocusStyle,
                  WebTouchManipulation,
                ]}
                onPress={handleCreate}
                onFocus={() => setWizardButtonFocused(true)}
                onBlur={() => setWizardButtonFocused(false)}
                disabled={submitting}
                accessibilityLabel="Crear spot"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.primaryButtonLabel, { color: colors.background }]}>
                    Crear spot
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  headerCloseTouchable: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  stepFull: {
    flex: 1,
  },
  step6Wrap: {
    flex: 1,
  },
  /** Contenedor con posición relativa para que la barra fija (absolute) se ancle al paso. */
  stepWithFixedBar: {
    position: 'relative',
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  scrollContentWithBar: {
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
    flexGrow: 1,
  },
  wizardButtonSpacer: {
    height: 88,
  },
  wizardButtonBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  /** Separación mínima 40px entre último campo y botones (scroll alcanzable con teclado). */
  gapBeforeButtons: {
    minHeight: 40,
  },
  wizardButtonBarInScroll: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  /** Barra de botón(es) pegada al borde inferior; se ajusta con teclado (bottom: keyboardHeightWeb en web). */
  wizardButtonBarFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    backgroundColor: 'transparent',
  },
  /** Padding inferior del scroll para no quedar tapado por la barra fija. */
  scrollContentAboveFixedBar: {
    paddingBottom: 100,
  },
  label: {
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 17,
    marginBottom: Spacing.base,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  /** Banner duplicado: justo debajo del header, empuja el contenido hacia abajo. */
  duplicateBannerBelowHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  duplicateBannerTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  duplicateBannerMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  duplicateBannerButtonPrimary: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flex: 1,
    minWidth: 120,
  },
  duplicateBannerButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  summaryBlock: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  summaryAddress: {
    fontSize: 14,
  },
  summaryMeta: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  stepImageOnly: {
    marginTop: Spacing.sm,
  },
  coverSection: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  coverLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  coverPreviewWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 320,
    aspectRatio: 16 / 10,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  coverRemoveBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  coverRemoveLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  coverAddWrap: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    minHeight: 120,
  },
  coverAddLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  coverAddWrapLarge: {
    width: 200,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    minHeight: 100 + 28,
  },
  coverAddLabelLarge: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: Spacing.sm,
  },
});
