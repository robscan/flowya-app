/**
 * Design System: Spot Detail (canonical).
 * Header hero, acciones overlay, mapa del spot, contenido, edición inline.
 * Web-first; colores y semántica desde la librería.
 */

import { ArrowLeft, Pencil, Pin, Share2, X } from 'lucide-react-native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Colors, Radius, Shadow, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { optimizeSpotImage } from '@/lib/spot-image-optimize';
import { uploadSpotCover } from '@/lib/spot-image-upload';
import { supabase } from '@/lib/supabase';

import { ConfirmModal } from '../ui/confirm-modal';
import { ButtonPrimary } from './buttons';
import type { SavePinState } from './icon-button';
import { IconButton } from './icon-button';
import { ImagePlaceholder } from './image-placeholder';
import type { SpotPinStatus } from './map-pins';
import { SpotImage } from './spot-image';

export type SpotDetailSpot = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  /** Dirección postal legible (calle, colonia, ciudad). Si no existe, no se muestra Ubicación. */
  address?: string | null;
  pinStatus?: SpotPinStatus;
};

export type SpotDetailProps = {
  spot: SpotDetailSpot;
  isEditing: boolean;
  /** Estado visual del botón Guardar pin: default (no guardado), toVisit, visited. */
  savePinState?: SavePinState;
  onBack: () => void;
  onSavePin?: () => void;
  onShare?: () => void;
  onEdit: () => void;
  /** Salir del modo edición sin guardar (solo cuando isEditing). */
  onCancelEdit?: () => void;
  onSaveEdit: (payload: {
    title: string;
    description_short: string | null;
    description_long: string | null;
  }) => void;
  /** Eliminar spot definitivamente (tras confirmación). */
  onDeleteSpot?: () => void;
  /** Slot para el mapa (pantalla inyecta Mapbox; Design System puede usar placeholder). */
  mapSlot: React.ReactNode;
  /** Texto de distancia, ej. "A 1.2 km de tu ubicación". Solo si hay ubicación del usuario. */
  distanceText?: string | null;
  /** Al tocar la imagen del hero (abrir en grande). */
  onImagePress?: (uri: string) => void;
  /** Tras cambiar o quitar la foto de portada (Edit Spot). */
  onCoverImageChange?: (url: string | null) => void;
};

const HERO_HEIGHT = 240;
const MAP_SECTION_HEIGHT = 320;
const ICON_SIZE = 22;

/** Color del icono sobre fondos stateToVisit / stateSuccess. */
const ICON_ON_STATE = '#ffffff';

export function SpotDetail({
  spot,
  isEditing,
  savePinState = 'default',
  onBack,
  onSavePin,
  onShare,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteSpot,
  mapSlot,
  distanceText,
  onImagePress,
  onCoverImageChange,
}: SpotDetailProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState(spot.title);
  const [short, setShort] = useState(spot.description_short ?? '');
  const [long, setLong] = useState(spot.description_long ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const prevEditing = useRef(isEditing);
  const backButtonRef = useRef<View>(null);

  useEffect(() => {
    const justEnteredEdit = isEditing && !prevEditing.current;
    if (!isEditing || justEnteredEdit) {
      setTitle(spot.title);
      setShort(spot.description_short ?? '');
      setLong(spot.description_long ?? '');
    }
    prevEditing.current = isEditing;
  }, [spot.title, spot.description_short, spot.description_long, isEditing]);

  const handleSaveEdit = useCallback(() => {
    onSaveEdit({
      title: title.trim() || spot.title,
      description_short: short.trim() || null,
      description_long: long.trim() || null,
    });
  }, [title, short, long, spot.title, onSaveEdit]);

  const handleAddOrChangeCover = useCallback(async () => {
    if (!onCoverImageChange || !spot.id) return;
    setCoverUploading(true);
    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        setCoverUploading(false);
        return;
      }
      const res = await fetch(result.assets[0].uri);
      if (!res.ok) {
        setCoverUploading(false);
        return;
      }
      const blob = await res.blob();
      const optimized = await optimizeSpotImage(blob);
      const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
      if (!toUpload) {
        setCoverUploading(false);
        return;
      }
      const url = await uploadSpotCover(spot.id, toUpload);
      if (url) {
        const { error } = await supabase
          .from('spots')
          .update({ cover_image_url: url })
          .eq('id', spot.id);
        if (!error) {
          // Cache-bust para que la nueva imagen se muestre al reemplazar (misma URL, contenido nuevo)
          const displayUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          onCoverImageChange(displayUrl);
        }
      }
    } catch {
      // Silencioso: no mostrar errores técnicos al usuario
    } finally {
      setCoverUploading(false);
    }
  }, [spot.id, onCoverImageChange]);

  const handleRemoveCover = useCallback(async () => {
    if (!onCoverImageChange || !spot.id) return;
    setCoverUploading(true);
    try {
      const { error } = await supabase
        .from('spots')
        .update({ cover_image_url: null })
        .eq('id', spot.id);
      if (!error) onCoverImageChange(null);
    } catch {
      // Silencioso
    } finally {
      setCoverUploading(false);
    }
  }, [spot.id, onCoverImageChange]);

  const handleDeleteSpotPress = useCallback(() => {
    if (onDeleteSpot) setShowDeleteConfirm(true);
  }, [onDeleteSpot]);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    onDeleteSpot?.();
  }, [onDeleteSpot]);

  useLayoutEffect(() => {
    const node = backButtonRef.current as unknown as HTMLElement | null;
    if (node?.focus) node.focus();
  }, []);

  const savePinIconColor =
    savePinState === 'toVisit' || savePinState === 'visited' ? ICON_ON_STATE : colors.background;

  return (
    <View
      style={[styles.root, Platform.OS === 'web' && styles.rootWebScroll]}
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, styles.scrollContentGrow]}
        showsVerticalScrollIndicator
      >
        {/* Hero */}
        <View
          style={[styles.hero, { backgroundColor: colors.surfaceMuted ?? colors.border }]}
        >
          <SpotImage
            uri={spot.cover_image_url}
            height={HERO_HEIGHT}
            borderRadius={0}
            colorScheme={colorScheme ?? undefined}
            onPress={
              spot.cover_image_url && onImagePress
                ? () => onImagePress(spot.cover_image_url!)
                : undefined
            }
          />
          {/* Overlay de acciones */}
          <View
            style={[styles.heroActions, { pointerEvents: 'box-none' }]}
          >
            <View style={styles.heroActionsLeft}>
              <IconButton
                ref={backButtonRef}
                variant="default"
                onPress={onBack}
                accessibilityLabel="Volver"
              >
                <ArrowLeft size={ICON_SIZE} color={colors.text} strokeWidth={2} />
              </IconButton>
            </View>
            <View style={styles.heroActionsRight}>
              {onSavePin ? (
                <IconButton
                  variant="savePin"
                  savePinState={savePinState}
                  onPress={onSavePin}
                  accessibilityLabel="Guardar pin"
                >
                  <Pin size={ICON_SIZE} color={savePinIconColor} strokeWidth={2} />
                </IconButton>
              ) : null}
              {onShare ? (
                <IconButton
                  variant="default"
                  onPress={onShare}
                  accessibilityLabel="Compartir"
                >
                  <Share2 size={ICON_SIZE} color={colors.text} strokeWidth={2} />
                </IconButton>
              ) : null}
              <IconButton
                variant={isEditing ? 'primary' : 'default'}
                onPress={isEditing ? onCancelEdit : onEdit}
                accessibilityLabel={isEditing ? 'Salir de edición' : 'Editar'}
              >
                <Pencil
                  size={ICON_SIZE}
                  color={isEditing ? ICON_ON_STATE : colors.text}
                  strokeWidth={2}
                />
              </IconButton>
            </View>
          </View>
        </View>

        {/* Contenido */}
        <View
          style={[styles.content, { borderColor: colors.borderSubtle }]}
        >
          {isEditing ? (
            <>
              {onCoverImageChange ? (
                <View style={styles.coverEditSection}>
                  <Text style={[styles.coverEditLabel, { color: colors.textSecondary }]}>
                    Foto de portada
                  </Text>
                  {spot.cover_image_url ? (
                    <View style={styles.coverEditImageWrap}>
                      <Pressable
                        style={styles.coverEditImageTouch}
                        onPress={handleAddOrChangeCover}
                        disabled={coverUploading}
                        accessibilityLabel="Cambiar foto"
                      >
                        {coverUploading ? (
                          <View style={[styles.coverEditImageOverlay, { backgroundColor: colors.background }]}>
                            <ActivityIndicator size="small" color={colors.text} />
                          </View>
                        ) : null}
                        <SpotImage
                          uri={spot.cover_image_url}
                          height={140}
                          borderRadius={Radius.md}
                          colorScheme={colorScheme ?? undefined}
                        />
                      </Pressable>
                      <Pressable
                        style={[styles.coverEditRemoveBtn, { backgroundColor: colors.background }]}
                        onPress={handleRemoveCover}
                        disabled={coverUploading}
                        accessibilityLabel="Quitar foto"
                      >
                        <X size={18} color={colors.text} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.coverEditPlaceholder, { borderColor: colors.borderSubtle }]}
                      onPress={handleAddOrChangeCover}
                      disabled={coverUploading}
                      accessibilityLabel="Agregar foto"
                    >
                      {coverUploading ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <>
                          <ImagePlaceholder
                            width={200}
                            height={100}
                            borderRadius={Radius.md}
                            colorScheme={colorScheme ?? undefined}
                            iconSize={24}
                          />
                          <Text style={[styles.coverEditPlaceholderLabel, { color: colors.textSecondary }]}>
                            Agregar foto
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              ) : null}
              <TextInput
                style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={[styles.descInput, { color: colors.text, borderColor: colors.border }]}
                value={short}
                onChangeText={setShort}
                placeholder="Descripción corta"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <TextInput
                style={[styles.descInput, styles.descInputLong, { color: colors.text, borderColor: colors.border }]}
                value={long}
                onChangeText={setLong}
                placeholder="Descripción larga"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>{spot.title}</Text>
              {spot.description_short ? (
                <Text style={[styles.descriptionShort, { color: colors.textSecondary }]}>
                  {spot.description_short}
                </Text>
              ) : null}
              {spot.description_long ? (
                <>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>¿Por qué importa?</Text>
                  <Text style={[styles.descriptionLong, { color: colors.textSecondary }]}>
                    {spot.description_long}
                  </Text>
                </>
              ) : null}
            </>
          )}
        </View>

        {/* Sección mapa: ancla semántica + distancia + mapa + dirección */}
        {!isEditing ? (
          <>
            <View
              style={[styles.mapSectionWrap, { borderTopColor: colors.borderSubtle }]}
            >
              <Text style={[styles.sectionHeading, { color: colors.text }]}>¿Dónde está?</Text>
              {distanceText ? (
                <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                  {distanceText}
                </Text>
              ) : null}
            </View>
            <View
              style={[styles.mapSection, { backgroundColor: colors.surfaceMuted ?? colors.border }]}
            >
              {mapSlot}
            </View>
            {spot.address ? (
              <View
                style={[styles.locationInfo, { borderTopColor: colors.borderSubtle }]}
              >
                <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                  {spot.address}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <View
            style={[styles.mapSection, { backgroundColor: colors.surfaceMuted ?? colors.border }]}
          >
            {mapSlot}
          </View>
        )}

        {/* Footer en modo edición: Guardar + Eliminar Spot */}
        {isEditing ? (
          <View style={[styles.editFooter, { borderTopColor: colors.borderSubtle }]}>
            <ButtonPrimary
              onPress={handleSaveEdit}
              accessibilityLabel="Guardar"
            >
              Guardar
            </ButtonPrimary>
            {onDeleteSpot ? (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
                  },
                  WebTouchManipulation,
                ]}
                onPress={handleDeleteSpotPress}
                accessibilityLabel="Eliminar spot"
                accessibilityRole="button"
              >
                <Text style={[styles.destructiveButtonLabel, { color: colors.textSecondary }]}>
                  Eliminar Spot
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar este spot?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** Web: minHeight 0 permite que ScrollView reciba altura acotada y habilite overflow. */
  rootWebScroll: {
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  /** Permite que el contenido crezca más que el viewport para habilitar scroll. */
  scrollContentGrow: {
    flexGrow: 1,
  },
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  heroActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  heroActionsLeft: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  heroActionsRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  mapSectionWrap: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
  },
  distanceText: {
    fontSize: 15,
    lineHeight: 22,
  },
  mapSection: {
    height: MAP_SECTION_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  locationInfo: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    lineHeight: 34,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  descriptionShort: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: Spacing.base,
  },
  descriptionLong: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  descInput: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: Spacing.base,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 60,
  },
  descInputLong: {
    minHeight: 100,
  },
  metadata: {
    marginTop: Spacing.sm,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  metadataValue: {
    fontSize: 14,
  },
  saveEditLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  editFooter: {
    marginTop: 40,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  destructiveButtonLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
  coverEditSection: {
    marginBottom: Spacing.lg,
  },
  coverEditLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  coverEditImageWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  coverEditImageTouch: {
    width: '100%',
  },
  coverEditImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  coverEditRemoveBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.subtle,
  },
  coverEditPlaceholder: {
    width: 200,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    minHeight: 100 + 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEditPlaceholderLabel: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
});

/** Placeholder para el mapa en el Design System (sin Mapbox). */
function MapPlaceholder() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Mapa del spot</Text>
    </View>
  );
}

const MOCK_SPOT: SpotDetailSpot = {
  id: 'design-system-mock',
  title: 'Ejemplo Spot Detail',
  description_short: 'Descripción corta para el showcase del Design System.',
  description_long:
    'Descripción larga opcional. Aquí se muestra metadata y el layout hero + mapa + contenido. Modo lectura y modo edición inline.',
  cover_image_url: null,
  latitude: 20.4,
  longitude: -87.2,
  pinStatus: 'default',
};

/** Showcase Spot Detail: hero, acciones, mapa, contenido; modo lectura y edición inline. */
export function SpotDetailShowcase() {
  const [isEditing, setIsEditing] = useState(false);
  const [spot, setSpot] = useState<SpotDetailSpot>(MOCK_SPOT);

  return (
    <View style={{ height: 560, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.lg, overflow: 'hidden' }}>
      <SpotDetail
        spot={spot}
        isEditing={isEditing}
        onBack={() => {}}
        onSavePin={() => {}}
        onShare={() => {}}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={() => setIsEditing(false)}
        onSaveEdit={(payload) => {
          setSpot((prev) => (prev ? { ...prev, ...payload } : prev));
          setIsEditing(false);
        }}
        mapSlot={<MapPlaceholder />}
      />
    </View>
  );
}
