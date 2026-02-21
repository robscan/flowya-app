/**
 * Design System screen (web-only).
 * Displays canonical UI components. Modern, minimal, editorial base.
 */

import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { FlowyaBetaModal } from '@/components/ui/flowya-beta-modal';

import {
    ButtonsShowcase,
    CardsShowcase,
    ColorsShowcase,
    IconButton,
    ImagePlaceholder,
    MapControls,
    MapLocationPicker,
    MapPinFilter,
    MapPinFilterInline,
    MapPinsShowcase,
    MapUIShowcase,
    SearchPill,
    SearchResultsShowcase,
    SpotCard,
    SpotDetailShowcase,
    SpotImage,
    TypographyShowcase,
} from '@/components/design-system';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MapPinPlus, Pin, Share2, User } from 'lucide-react-native';

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
            Canonical UI components. Add new elements here as reusable primitives.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Paleta global de colores
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Fuente única: primarios, secundarios, texto, estados (success, toVisit). Light y
              dark. Map pins y botones consumen esta paleta.
            </Text>
            <ColorsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Typography</Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <TypographyShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Buttons</Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <ButtonsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Botón de icono (canónico)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Fuente de verdad: estilo del Hero de Spot Detail. Todos los botones de icono del
              sistema (Crear spot, Guardar pin, Compartir, Editar, controles del mapa) usan este
              componente. Variantes: default, primary, savePin. Estados hover / pressed / focus
              unificados.
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Botón de pin (Scope D): mismo icono (Pin). Estados por color: idle = neutral (no guardado),
              toVisit = stateToVisit, visited = stateSuccess. La lógica de transición (guardar / cambiar
              estado) se maneja en pantalla; el componente solo representa el estado recibido.
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Botón compartir (Scope E): mismo icono (Share2). Al presionar: si está disponible Web Share API
              se usa navigator.share(); si no, se copia el link /spot/:id al clipboard. Feedback mínimo:
              toast &quot;Link copiado&quot; cuando se copia. No se comparten pins ni estado.
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Botón de perfil (Scope I): icono User. Ubicación: extremo superior izquierdo de la app.
              Estados: no autenticado = icono neutro (variant default); autenticado = mismo aspecto.
              Al presionar sin sesión: abre el sheet de auth (Magic Link). Con sesión: por ahora no hace nada.
              Acceso adicional al auth; el flujo al guardar pin sin sesión se mantiene.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.base, alignItems: 'center', flexWrap: 'wrap' }}>
              <IconButton variant="default" onPress={() => {}} accessibilityLabel="Cuenta (perfil)">
                <User size={24} color={colors.text} strokeWidth={2} />
              </IconButton>
              <IconButton variant="default" onPress={() => {}} accessibilityLabel="Compartir">
                <Share2 size={22} color={colors.text} strokeWidth={2} />
              </IconButton>
              <IconButton variant="default" onPress={() => {}} accessibilityLabel="Crear spot">
                <MapPinPlus size={24} color={colors.text} strokeWidth={2} />
              </IconButton>
              <IconButton
                variant="savePin"
                savePinState="default"
                onPress={() => {}}
                accessibilityLabel="Guardar pin (sin guardar)"
              >
                <Pin size={22} color={colors.text} strokeWidth={2} />
              </IconButton>
              <IconButton
                variant="savePin"
                savePinState="toVisit"
                onPress={() => {}}
                accessibilityLabel="Por visitar"
              >
                <Pin size={22} color="#ffffff" strokeWidth={2} />
              </IconButton>
              <IconButton
                variant="savePin"
                savePinState="visited"
                onPress={() => {}}
                accessibilityLabel="Visitado"
              >
                <Pin size={22} color="#ffffff" strokeWidth={2} />
              </IconButton>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Search pill (Explore entry point)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Entry point para abrir búsqueda en Explore. Estilo Apple Maps. minWidth 150px para evitar
              colapso. variant=onDark en BottomDock: fondo blanco y texto oscuro sobre cluster flotante.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.base, alignItems: 'center', flexWrap: 'wrap' }}>
              <SearchPill onPress={() => {}} variant="default" />
              <View
                style={{
                  padding: Spacing.base,
                  borderRadius: 999,
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
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Alerta suave (Scope G)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Para prevención de duplicados (Create Spot): mensaje claro y humano, no técnico.
              Opciones: Cancelar, Cambiar nombre, Mover ubicación. Sin modales invasivos ni errores
              rojos. Ejemplo de copy: título &quot;Spot muy parecido&quot;, mensaje que explique que ya existe
              un lugar con ese nombre cerca y ofrezca corregir nombre o ubicación.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            ImagePlaceholder
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Fallback global cuando no hay imagen o falla la carga. Hero, cards, listas. Fondo
              surfaceMuted, ícono image-plus, sin texto. Light y dark.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' }}>
              <ImagePlaceholder width={120} height={120} colorScheme="light" />
              <ImagePlaceholder width={120} height={120} colorScheme="dark" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Imagen de spot (Scope C)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Placeholder canónico: ImagePlaceholder (mismo en SpotCard, SpotDetail, Create Spot).
              Componente SpotImage: estados loading | image | placeholder | error. Si no hay URI o
              falla la carga → placeholder. Nunca mostrar imagen rota. onPress opcional para abrir
              en grande (ImageFullscreenModal).
            </Text>
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
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Cards / containers
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <CardsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Modal de auth (Scope I)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Sheet/modal ligero para Magic Link. Una pantalla: input email + CTA «Enviar enlace».
              Estados: idle, loading, success (Revisa tu correo), error. Dos variantes por contexto:
              AUTH_MODAL_MESSAGES.savePin (guardar pin) y AUTH_MODAL_MESSAGES.profile (icono perfil).
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() =>
                  openAuthModal({ message: AUTH_MODAL_MESSAGES.savePin })
                }
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                  savePin
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() =>
                  openAuthModal({ message: AUTH_MODAL_MESSAGES.profile })
                }
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                  profile
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Modal de confirmación (logout)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              ConfirmModal: mismo formato que Modal de auth (sheet, backdrop, sombra). Reemplaza
              window.confirm / Alert.alert. Usos: cerrar sesión, eliminar spot. variant: default |
              destructive.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 12,
                  backgroundColor: colors.stateError,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => setShowLogoutConfirm(true)}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                  Logout
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  borderRadius: 12,
                  backgroundColor: colors.stateError,
                  opacity: pressed ? 0.9 : 1,
                })}
                onPress={() => setShowDeleteSpotConfirm(true)}
              >
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                  Eliminar spot
                </Text>
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            FlowyaBetaModal
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Modal canónico para FLOWYA Beta + feedback. Misma estructura que Auth modal.
              Información de beta, autoría, textarea para feedback. Envío por email vía Resend.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.demoButton,
                {
                  backgroundColor: pressed ? colors.text : colors.primary,
                },
              ]}
              onPress={() => setShowBetaModal(true)}
            >
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
                Abrir FLOWYA Beta
              </Text>
            </Pressable>
            <FlowyaBetaModal
              visible={showBetaModal}
              onClose={() => setShowBetaModal(false)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>Spot card</Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              SpotCardMapSelection: card al seleccionar pin. Fila 1: título | acciones. Fila 2:
              miniatura 72×40 | descripción. Texto sin truncar; altura auto. Se cierra al tocar fuera.
            </Text>
            <SpotCard
              spot={{
                id: 'example',
                title: 'Example Spot',
                description_short:
                  'Descripción corta que puede ocupar varias líneas sin cortarse artificialmente.',
                cover_image_url: null,
              }}
              savePinState="default"
              onSavePin={() => {}}
              onShare={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Search result card (listado de búsqueda)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              SearchResultCard: card del listado de resultados de búsqueda en el mapa. Misma base
              visual que SpotCardMapSelection pero sin botones guardar/compartir (hideActions).
              Estados savePinState: default, toVisit, visited. SearchResultsShowcase: ejemplo de
              varias cards apiladas como en el listado.
            </Text>
            <SearchResultsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Spot Detail
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Hero con imagen o ImagePlaceholder. Acciones overlay. Contenido: título,
              descripción corta/larga. Ubicación solo si hay dirección postal (nunca coordenadas).
              Mapa al final del layout. Edición inline. Abajo: ejemplo con dirección (sección
              visible) vs sin dirección (sección oculta).
            </Text>
            <SpotDetailShowcase />
            <Text
              style={{
                ...styles.sectionDescription,
                color: colors.textSecondary,
                marginTop: Spacing.lg,
                marginBottom: Spacing.sm,
              }}
            >
              Ejemplo bloque Ubicación (cuando spot.address existe):
            </Text>
            <View
              style={{
                padding: Spacing.base,
                backgroundColor: colors.background,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>UBICACIÓN</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                Av. Principal 123, Col. Centro, Ciudad
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Map pin filter
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Dropdown estilo Apple Mail. Trigger muestra valor seleccionado; al tocar se despliegan
              Todos, Por visitar (con count) y Visitados (con count). Iconos: Globe, Pin, CheckCircle.
              Counts en badge circular (28×28): en trigger, círculo blanco + texto negro; en menú,
              círculo negro + texto blanco. Menú centrado bajo el trigger. Animaciones: menú
              scale+opacity al abrir/cerrar; pulse en trigger al cambiar valor; LayoutAnimation para
              transición de layout. Solo afecta qué pins se muestran; no modifica datos ni estado.
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap', marginTop: Spacing.base, alignItems: 'center' }}>
              <MapPinFilter value="all" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
              <MapPinFilter value="saved" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
              <MapPinFilter value="visited" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
            </View>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.lg }}>
              Variante inline para panel de búsqueda: tres pills en una sola fila, sin dropdown.
              Mismo diseño (iconos, colores, counts).
            </Text>
            <View style={{ marginTop: Spacing.sm, width: '100%', maxWidth: 360 }}>
              <MapPinFilterInline value="all" onChange={() => {}} counts={{ saved: 3, visited: 7 }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Map pins
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Pines unificados: ubicación (círculo azul, sin label). Spots: punto con borde + nombre
              debajo (caption, max 2 líneas, truncado). Estados: normal, por visitar, visitado;
              seleccionado aumenta peso/opacidad del label. Tamaños: reposo 12px, seleccionado 36px
              (estilo Apple Maps ~30–40px), icono interno 20px. Animaciones: scale al seleccionar,
              hover (1.08x) y press (0.95x) en reposo. Pin y label forman un solo componente
              (se mueven juntos). Paleta global; light y dark.
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Create Spot (Scope G visual): jerarquía clara. Spot en creación = MapPinCreating (primary,
              tamaño 20px, foco principal, siempre encima). Spots existentes cercanos = MapPinExisting
              (secondary, 10px, tono tenue). Regla semántica: el usuario ve “aquí estoy creando” vs “lugares
              que ya existen cerca”.
            </Text>
            <MapPinsShowcase />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            MapLocationPicker
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Selección de ubicación en mapa. Estados: empty (sin pin), selecting (pin activo),
              confirmed (pin confirmado). Tap en mapa coloca/mueve un solo pin. CTA «Confirmar
              ubicación» solo cuando hay pin. Al confirmar: reverse geocoding una vez, retorna
              {` { latitude, longitude, address }`}. Props: onConfirm, onCancel (opcional).
            </Text>
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Scope G visual: muestra spots existentes cercanos (MapPinExisting) y el pin de la ubicación
              seleccionada (MapPinCreating, más grande y primary). Radio de búsqueda reutilizado de
              validación de duplicados (~150 m). Solo informativo; no cambia reglas de creación.
            </Text>
            <View style={{ height: 320, borderRadius: Radius.md, overflow: 'hidden' }}>
              <MapLocationPicker
                onConfirm={() => {}}
                onCancel={() => {}}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Create Spot Wizard (Scope A)
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Wizard 1 campo por pantalla: (1) MapLocationPicker → ubicación + address, (2) Título,
              (3) Descripción corta, (4) Descripción larga, (5) Crear. Validaciones: ubicación +
              título requeridos. Al crear: insert spots, volver a mapa, SpotCard del nuevo spot
              abierta. Flujo real en /create-spot.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Map controls
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <Text style={{ ...styles.sectionDescription, color: colors.textSecondary }}>
              Controles del mapa: ver todo (encuadrar usuario + spots visibles), zoom in/out, centrar en
              ubicación. Sin contenedor visible (solo botones circulares). Lucide icons.               MapControlButton
              / ViewAll: FrameWithDot (custom, marco + punto), estados default / pressed / disabled (sin spots).
              Aquí sin mapa (deshabilitados).
            </Text>
            <MapControls map={null} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, color: colors.textSecondary }}>
            Map-related UI
          </Text>
          <View
            style={{
              ...styles.sectionContent,
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderSubtle,
              ...Shadow.subtle,
            }}
          >
            <MapUIShowcase />
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
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: 14,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  backLink: {
    fontSize: 17,
    fontWeight: '500',
  },
  demoButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
});
