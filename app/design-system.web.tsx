/**
 * Design System screen (web-only).
 * Canonical visual playground for active Explore/Edit Spot components.
 */

import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';

import {
  ButtonPrimary,
  ButtonSecondary,
  ColorsShowcase,
  IconButton,
  ImagePlaceholder,
  MapControls,
  MapLocationPicker,
  MapPinFilter,
  MapPinFilterInline,
  MapPinsShowcase,
  SearchPill,
  SearchListCard,
  SpotDetailShowcase,
  SpotImage,
  TypographyShowcase,
} from '@/components/design-system';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { FlowyaBetaModal } from '@/components/ui/flowya-beta-modal';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Check, MapPinPlus } from 'lucide-react-native';

export default function DesignSystemScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { openAuthModal } = useAuthModal();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteSpotConfirm, setShowDeleteSpotConfirm] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'Design System' }} />
      <ScrollView
        style={{ ...styles.scroll, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <View style={styles.header}>
          <Text style={{ ...styles.pageTitle, color: colors.text }}>Design System</Text>
          <Text style={{ ...styles.pageSubtitle, color: colors.textSecondary }}>
            Canon operativo (Explore + Edit Spot). Sin elementos legacy ni showcases duplicados.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Estado del catálogo (2026-02-27)
          </Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Alcance activo: Explorar (map/filter/controls/search/sheet) y Edit Spot.
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginBottom: 0 }}>
              Este catálogo incluye únicamente componentes activos del runtime.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Matriz de estados (F1-002)
          </Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Verifica aquí los estados canónicos: default, hover/pressed, focus-visible (web), selected, disabled y loading.
            </Text>

            <View style={{ gap: Spacing.base }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                <IconButton accessibilityLabel="Icon default">
                  <MapPinPlus size={20} color={colors.text} />
                </IconButton>
                <IconButton accessibilityLabel="Icon selected" selected>
                  <Check size={20} color="#fff" />
                </IconButton>
                <IconButton accessibilityLabel="Icon loading" loading>
                  <MapPinPlus size={20} color={colors.text} />
                </IconButton>
                <IconButton accessibilityLabel="Icon disabled" disabled>
                  <MapPinPlus size={20} color={colors.text} />
                </IconButton>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                <ButtonPrimary accessibilityLabel="Primary default">Primary</ButtonPrimary>
                <ButtonPrimary accessibilityLabel="Primary loading" loading>Loading</ButtonPrimary>
                <ButtonSecondary accessibilityLabel="Secondary default">Secondary</ButtonSecondary>
                <ButtonSecondary accessibilityLabel="Secondary disabled" disabled>Disabled</ButtonSecondary>
              </View>

              <View style={{ maxWidth: 560, gap: Spacing.sm }}>
                <SearchListCard
                  title="Search row con imagen"
                  subtitle="Variante con thumbnail para validar layout, recorte y alineación."
                  onPress={() => {}}
                  imageUri="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400"
                  accessibilityLabel="Search row con imagen"
                />
                <SearchListCard
                  title="Search row default"
                  subtitle="Estado base de fila de resultados."
                  onPress={() => {}}
                  accessibilityLabel="Search row default"
                />
                <SearchListCard
                  title="Search row selected"
                  subtitle="Selected persistente para validar jerarquía."
                  onPress={() => {}}
                  selected
                  pinStatus="to_visit"
                  accessibilityLabel="Search row selected"
                />
                <SearchListCard
                  title="Search row disabled"
                  subtitle="Deshabilitado para validar contraste y legibilidad."
                  onPress={() => {}}
                  disabled
                  pinStatus="visited"
                  accessibilityLabel="Search row disabled"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Paleta global</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <ColorsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Typography</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <TypographyShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Search entry pill</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <View style={{ flexDirection: 'row', gap: Spacing.base, alignItems: 'center', flexWrap: 'wrap' }}>
              <SearchPill onPress={() => {}} variant="default" />
              <View
                style={{
                  padding: Spacing.base,
                  borderRadius: Radius.pill,
                  backgroundColor: colorScheme === 'dark' ? 'rgba(40,40,42,0.94)' : 'rgba(28,28,30,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <SearchPill onPress={() => {}} variant="onDark" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Imágenes</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap', marginBottom: Spacing.base }}>
              <ImagePlaceholder width={120} height={120} colorScheme="light" />
              <ImagePlaceholder width={120} height={120} colorScheme="dark" />
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <SpotImage uri={null} width={120} height={120} colorScheme="light" />
              <SpotImage
                uri="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"
                width={120}
                height={120}
                colorScheme="light"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Modales</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: Radius.md,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => openAuthModal({ message: AUTH_MODAL_MESSAGES.savePin })}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Auth savePin</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: Radius.md,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => openAuthModal({ message: AUTH_MODAL_MESSAGES.profile })}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Auth profile</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: Radius.md,
                  backgroundColor: colors.stateError,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => setShowLogoutConfirm(true)}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Logout confirm</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: Radius.md,
                  backgroundColor: colors.stateError,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => setShowDeleteSpotConfirm(true)}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Delete confirm</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: Radius.md,
                  backgroundColor: pressed ? colors.text : colors.primary,
                })}
                onPress={() => setShowBetaModal(true)}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>FLOWYA Beta</Text>
              </Pressable>
            </View>

            <ConfirmModal
              visible={showLogoutConfirm}
              title="¿Cerrar sesión?"
              confirmLabel="Cerrar sesión"
              cancelLabel="Cancelar"
              variant="destructive"
              onConfirm={() => setShowLogoutConfirm(false)}
              onCancel={() => setShowLogoutConfirm(false)}
            />
            <ConfirmModal
              visible={showDeleteSpotConfirm}
              title="¿Eliminar este spot?"
              message="Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              cancelLabel="Cancelar"
              variant="destructive"
              onConfirm={() => setShowDeleteSpotConfirm(false)}
              onCancel={() => setShowDeleteSpotConfirm(false)}
            />
            <FlowyaBetaModal visible={showBetaModal} onClose={() => setShowBetaModal(false)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Spot Detail</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <SpotDetailShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Map pin filter</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap', marginTop: Spacing.base, alignItems: 'center' }}>
              <MapPinFilter value="all" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
              <MapPinFilter value="saved" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
              <MapPinFilter value="visited" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
            </View>
            <View style={{ marginTop: Spacing.sm, width: '100%', maxWidth: 360 }}>
              <MapPinFilterInline value="all" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Map pins</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <MapPinsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>MapLocationPicker</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <View style={{ height: 320, borderRadius: Radius.md, overflow: 'hidden' }}>
              <MapLocationPicker onConfirm={() => {}} onCancel={() => {}} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Map controls</Text>
          <View style={{ ...styles.sectionContent, backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle, ...Shadow.subtle }}>
            <MapControls map={null} />
          </View>
        </View>

        <View style={styles.footer}>
          <Link href="/(tabs)/explore" asChild>
            <Text style={{ ...styles.backLink, color: colors.tint }}>← Back to Explore</Text>
          </Link>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 48,
    marginBottom: Spacing.sm,
  },
  pageSubtitle: {
    fontSize: 17,
    lineHeight: 26,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  sectionContent: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  backLink: {
    fontSize: 17,
    fontWeight: '500',
  },
});
