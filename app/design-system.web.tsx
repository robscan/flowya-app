/**
 * Design System (web-only). Intro (inicio + alcance), luego Primitivos → Componentes → Templates.
 * TOC interactivo; anclas `nativeID` por sección.
 */

import { Link, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';

import { DesignSystemGroupHeading, DesignSystemSection } from '@/components/design-system/design-system-section';
import { buildInitialTocExpanded, DS_TOC_GROUPS, DsTocNav } from '@/components/design-system/ds-toc-nav';
import { DsElevationSwatches, DsRadiusSwatches, DsSpacingSwatches } from '@/components/design-system/ds-token-swatches';
import {
  ButtonsShowcase,
  ColorsShowcase,
  CountriesMapPreview,
  CountriesSheetCountryList,
  CountriesSheetKpiRow,
  CountriesSheetTemplateDemo,
  CountriesSheetVisitedProgress,
  DS_MOCK_COUNTRY_ITEMS,
  ExploreWelcomeSheet,
  ExploreCountriesFlowsPill,
  ExploreMapProfileButton,
  ExploreMapStatusRow,
  ExploreChromeSearchField,
  IconButtonShowcase,
  ClearIconCircleShowcase,
  ImagesShowcase,
  MapLocationPicker,
  MapPinFilter,
  MapPinFilterInline,
  MapPinsShowcase,
  type MapPinFilterValue,
  SearchListCard,
  ExploreFilterChipsShowcase,
  SearchSurfaceShowcase,
  ShareCountriesCardShowcase,
  SheetHandle,
  SpotDetailShowcase,
  TravelerLevelsList,
  TravelerLevelsModal,
  TagChip,
  TypographyShowcase,
  type ExploreWelcomeSheetState,
  type WelcomeBrowseItem,
} from '@/components/design-system';
import {
  WEB_MODAL_CARD_MAX_WIDTH,
  WEB_PANEL_PADDING_H,
  WEB_SEARCH_OVERLAY_MAX_WIDTH,
  WEB_SHEET_MAX_WIDTH,
  WEB_VIEWPORT_REF,
} from '@/lib/web-layout';
import { computeTravelerPoints, resolveTravelerLevelByPoints } from '@/lib/traveler-levels';
import { SearchInputV2 } from '@/components/search/SearchInputV2';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useSystemStatus } from '@/components/ui/system-status-bar';
import { FlowyaBetaModal } from '@/components/ui/flowya-beta-modal';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Search } from 'lucide-react-native';

/** A partir de tablet el índice va en columna lateral; debajo, modal con la misma lista. */
const DS_TOC_SIDEBAR_MIN_WIDTH = WEB_VIEWPORT_REF.tabletMin;
const DS_SIDEBAR_W = 232;

/** Nombres para compartir ajustes de diseño (vitrina filtros mapa). */
const DS_MAP_FILTER_VERSION = {
  chip: 'Map-filter · chip',
  inlineCompact: 'Map-filter · inline compacto',
  inlineWide: 'Map-filter · inline amplio',
  inlineDisabled: 'Map-filter · inline (Por visitar = 0 → deshabilitado)',
} as const;

const DS_F1_TAG_CHIPS: { id: string; label: string }[] = [
  { id: '1', label: 'ruta' },
  { id: '2', label: '2026' },
];

const DS_F1_QUICK_ETIQUETAR = [
  {
    id: 'tag',
    label: 'Etiquetar',
    kind: 'add_tag' as const,
    onPress: () => {},
    accessibilityLabel: 'Etiquetar este lugar',
  },
];

const DS_EXPLORE_WELCOME_MOCK_ITEMS: WelcomeBrowseItem[] = [
  {
    id: 'ds_welcome_spot_1',
    title: 'Basílica de la Sagrada Família',
    address: 'Barcelona',
    latitude: 41.4036,
    longitude: 2.1744,
    pinStatus: 'to_visit',
  },
  {
    id: 'ds_welcome_spot_2',
    title: 'Park Güell',
    address: 'Barcelona',
    latitude: 41.4145,
    longitude: 2.1527,
    pinStatus: 'visited',
  },
];

export default function DesignSystemScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sidebarLayout = windowWidth >= DS_TOC_SIDEBAR_MIN_WIDTH;
  const { openAuthModal } = useAuthModal();
  const toast = useSystemStatus();
  const scrollRef = useRef<ScrollView>(null);
  const yById = useRef<Record<string, number>>({});

  const [tocModalVisible, setTocModalVisible] = useState(false);
  const [tocExpanded, setTocExpanded] = useState(() => buildInitialTocExpanded(DS_TOC_GROUPS));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteSpotConfirm, setShowDeleteSpotConfirm] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [showTravelerLevelsModal, setShowTravelerLevelsModal] = useState(false);
  const [dsSearchQuery, setDsSearchQuery] = useState('Ejemplo de búsqueda');
  const [dsSearchFocused, setDsSearchFocused] = useState(false);
  const [dsMapFilterChip, setDsMapFilterChip] = useState<MapPinFilterValue>('all');
  const [dsMapFilterInlineCompact, setDsMapFilterInlineCompact] = useState<MapPinFilterValue>('all');
  const [dsMapFilterInlineWide, setDsMapFilterInlineWide] = useState<MapPinFilterValue>('all');
  const [dsMapFilterInlineDisabled, setDsMapFilterInlineDisabled] = useState<MapPinFilterValue>('all');
  const [dsTplWelcomeState, setDsTplWelcomeState] = useState<ExploreWelcomeSheetState>('medium');
  const [dsTplWelcomeEmptyList, setDsTplWelcomeEmptyList] = useState(false);
  const sectionCard = {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.borderSubtle,
    ...Shadow.subtle,
  };

  const registerY = useCallback((id: string, y: number) => {
    yById.current[id] = y;
  }, []);

  const scrollToId = useCallback((id: string) => {
    const y = yById.current[id];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  const scrollToIdFromMenu = useCallback(
    (id: string) => {
      scrollToId(id);
      setTocModalVisible(false);
    },
    [scrollToId],
  );

  const toggleTocGroup = useCallback((key: string) => {
    setTocExpanded((prev) => {
      const open = prev[key] ?? false;
      return { ...prev, [key]: !open };
    });
  }, []);

  const titleMuted = colors.textSecondary;
  /** Alto del “escenario” mapa + sheet: suficiente para gestionar peek / medium / expanded en una sola vitrina. */
  const dsWelcomeStageHeight = Math.min(880, Math.max(560, Math.round(windowHeight * 0.82)));

  const dsCountriesDemoTravelerPoints = computeTravelerPoints(12, 48);
  const dsCountriesDemoLevel = resolveTravelerLevelByPoints(dsCountriesDemoTravelerPoints);
  const dsCountriesDemoPointsLabel = new Intl.NumberFormat('es-MX').format(dsCountriesDemoTravelerPoints);

  const sidebarSticky =
    Platform.OS === 'web'
      ? ({ position: 'sticky' as const, top: 0, alignSelf: 'flex-start' } as const)
      : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Design System' }} />
      <View style={[styles.shell, { backgroundColor: colors.background }]}>
        <View style={[styles.shellRow, !sidebarLayout && styles.shellRowNarrow]}>
          {sidebarLayout ? (
            <View
              style={[
                styles.sidebar,
                { borderRightColor: colors.borderSubtle, backgroundColor: colors.backgroundElevated },
                sidebarSticky,
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator
                style={styles.sidebarScroll}
                contentContainerStyle={styles.sidebarScrollContent}
              >
                <Text style={[styles.sidebarHeading, { color: colors.text }]}>Contenidos</Text>
                <Text style={[styles.sidebarHint, { color: colors.textSecondary }]}>
                  Intro primero; Primitivos son tokens y layout. Categorías plegadas por defecto — expande para ver anclas.
                </Text>
                <DsTocNav
                  groups={DS_TOC_GROUPS}
                  expanded={tocExpanded}
                  onToggleGroup={toggleTocGroup}
                  onNavigate={scrollToId}
                  variant="sidebar"
                  colorScheme={colorScheme}
                />
              </ScrollView>
            </View>
          ) : null}

          <ScrollView
            ref={scrollRef}
            style={styles.scrollMain}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            {!sidebarLayout ? (
              <>
                <Pressable
                  onPress={() => setTocModalVisible(true)}
                  style={({ pressed }) => [
                    styles.tocMobileTrigger,
                    {
                      borderColor: colors.borderSubtle,
                      backgroundColor: pressed ? colors.stateSurfacePressed : colors.backgroundElevated,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir tabla de contenidos"
                >
                  <View style={styles.tocMobileTriggerText}>
                    <Text style={[styles.tocMobileTriggerTitle, { color: colors.text }]}>Tabla de contenidos</Text>
                    <Text style={[styles.tocMobileTriggerSub, { color: colors.textSecondary }]}>
                      Ver todas las secciones
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Abrir</Text>
                </Pressable>
                <Modal
                  visible={tocModalVisible}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setTocModalVisible(false)}
                >
                  <View style={styles.modalOuter}>
                    <Pressable
                      style={[StyleSheet.absoluteFillObject, styles.modalScrim]}
                      onPress={() => setTocModalVisible(false)}
                      accessibilityLabel="Cerrar tabla de contenidos"
                    />
                    <View
                      style={[
                        styles.modalPanel,
                        { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle },
                      ]}
                    >
                      <View style={styles.modalPanelHeader}>
                        <Text style={[styles.modalPanelTitle, { color: colors.text }]}>Contenidos</Text>
                        <Pressable onPress={() => setTocModalVisible(false)} accessibilityRole="button">
                          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>Cerrar</Text>
                        </Pressable>
                      </View>
                      <ScrollView style={styles.modalPanelScroll} showsVerticalScrollIndicator>
                        <DsTocNav
                          groups={DS_TOC_GROUPS}
                          expanded={tocExpanded}
                          onToggleGroup={toggleTocGroup}
                          onNavigate={scrollToIdFromMenu}
                          variant="modal"
                          colorScheme={colorScheme}
                        />
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              </>
            ) : null}

            <View nativeID="ds-top" onLayout={(e) => registerY('ds-top', e.nativeEvent.layout.y)}>
              <View style={styles.header}>
                <Text style={{ ...styles.pageTitle, color: colors.text }}>Design System</Text>
                <Text style={{ ...styles.pageSubtitle, color: colors.textSecondary }}>
                  Referencia visual y contratos para cambios canónicos. Capas: primitivos (tokens y layout), componentes
                  reutilizables y templates (composiciones de pantalla, mapa embebido, Explore, modales y runtime).
                </Text>
              </View>
            </View>

        <DesignSystemSection
          id="ds-intro"
          title="Alcance y contratos"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description={
            <>
              Alcance activo: Explorar (mapa, filtros, búsqueda, sheets) y Editar lugar. Inventario:{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md</Text>
              . Contratos: <Text style={{ fontWeight: '600', color: colors.text }}>USER_TAGS_EXPLORE</Text>,{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>SYSTEM_STATUS_TOAST</Text>.
            </>
          }
        >
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
            Esta página es principalmente <Text style={{ fontWeight: '600', color: colors.text }}>referencia</Text> (qué
            es y cómo se ve). Las notas breves indican cuándo usar o excepciones (p. ej. chips de filtro en SearchSurface
            vs TagChip).
          </Text>
        </DesignSystemSection>

        <DesignSystemGroupHeading
          id="ds-group-primitivos"
          title="Primitivos"
          textColor={colors.text}
          onLayoutY={registerY}
        />

        <DesignSystemSection
          id="ds-fund-colors"
          title="Paleta global"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
        >
          <ColorsShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-fund-typography"
          title="Typography"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Escala y muestras de texto. Para estilos reutilizables en código, exportamos TypographyStyles en typography.tsx (uso programático, no sustituye a esta referencia visual)."
        >
          <TypographyShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-fund-spacing"
          title="Espaciado (Spacing)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Ritmo en px desde constants/theme.ts — claves xs … xxxl."
        >
          <DsSpacingSwatches />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-fund-radius"
          title="Radio (Radius)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Border radius en px; pill usa Radius.pill (9999)."
        >
          <DsRadiusSwatches />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-fund-elevation"
          title="Elevación (Elevation)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Sombras de superficie: subtle, card y raised (más marcada). Shadow es alias del mismo objeto."
        >
          <DsElevationSwatches />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-fund-layout"
          title="Layout web — WR-01 (lib/web-layout)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description={
            <>
              Viewports: mobile {WEB_VIEWPORT_REF.mobileNarrow}–{WEB_VIEWPORT_REF.mobileWide}px, tablet{' '}
              {WEB_VIEWPORT_REF.tabletMin}–{WEB_VIEWPORT_REF.tabletMax}px, desktop {WEB_VIEWPORT_REF.desktopMin}px+.
              Anchos: panel {WEB_PANEL_PADDING_H}px · overlay búsqueda / sheet {WEB_SEARCH_OVERLAY_MAX_WIDTH}px
              (WEB_SHEET_MAX_WIDTH) · modal tarjeta {WEB_MODAL_CARD_MAX_WIDTH}px.
            </>
          }
        />

        <DesignSystemGroupHeading
          id="ds-group-componentes"
          title="Componentes"
          textColor={colors.text}
          onLayoutY={registerY}
        />

        <DesignSystemSection
          id="ds-act-buttons-showcase"
          title="Botones — ButtonPrimary / ButtonSecondary"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Matriz canónica por variante: estados interactivos, seleccionado, instantáneas de presionado/hover (web) y foco teclado. Import: @/components/design-system/buttons."
        >
          <ButtonsShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-icon-button"
          title="IconButton"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Matriz de estados: predeterminado, seleccionado, cargando, deshabilitado, variantes primary y savePin, foco teclado (web). Los controles del mapa (MapControls) reutilizan solo IconButton — sin sección aparte. Import: @/components/design-system/icon-button."
        >
          <IconButtonShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-clear-icon-circle"
          title="ClearIconCircle"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Botón circular compacto de limpiar (X); un solo tamaño en producto. No sustituye a IconButton. Import: @/components/design-system/clear-icon-circle."
        >
          <ClearIconCircleShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-list-tag"
          title="Etiquetas — TagChip (OL-EXPLORE-TAGS-001)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Modal de asignación y chips en cards. La fila de filtro del buscador (Cualquiera + etiquetas con icono Tag) es SearchSurface — no duplicar como TagChip."
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' }}>
            <TagChip label="playa" onPress={() => {}} accessibilityLabel="Demo añadir playa" />
            <TagChip label="sugerida" visualVariant="suggested" onPress={() => {}} />
            <TagChip label="favoritos" onRemove={() => {}} />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-list-rows"
          title="SearchListCard — filas de resultado"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Matriz visual única: distancia inline + #tags + Etiquetar en una franja; variaciones imagen, default, selected, disabled. SearchResultCard (search-result-card.tsx) solo mapea spot → estas props para el listado de búsqueda en mapa; no duplicar sección en DS."
        >
          <View style={{ maxWidth: 560, gap: Spacing.sm, alignSelf: 'stretch' }}>
            <SearchListCard
              title="Search row con imagen"
              subtitle="Thumbnail + señales completas."
              onPress={() => {}}
              imageUri="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400"
              accessibilityLabel="Search row con imagen"
              distanceText="1,2 km"
              pinStatus="to_visit"
              tagChips={DS_F1_TAG_CHIPS}
              quickActions={DS_F1_QUICK_ETIQUETAR}
            />
            <SearchListCard
              title="Search row default"
              subtitle="Sin imagen; icono categoría + señales completas."
              onPress={() => {}}
              accessibilityLabel="Search row default"
              distanceText="1,2 km"
              pinStatus="to_visit"
              tagChips={DS_F1_TAG_CHIPS}
              quickActions={DS_F1_QUICK_ETIQUETAR}
            />
            <SearchListCard
              title="Search row selected"
              subtitle="Selected persistente."
              onPress={() => {}}
              selected
              pinStatus="to_visit"
              accessibilityLabel="Search row selected"
              distanceText="1,2 km"
              tagChips={DS_F1_TAG_CHIPS}
              quickActions={DS_F1_QUICK_ETIQUETAR}
            />
            <SearchListCard
              title="Search row disabled"
              subtitle="Deshabilitado; pin visitado."
              onPress={() => {}}
              disabled
              pinStatus="visited"
              accessibilityLabel="Search row disabled"
              distanceText="1,2 km"
              tagChips={DS_F1_TAG_CHIPS}
              quickActions={DS_F1_QUICK_ETIQUETAR}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-medios"
          title="ImagePlaceholder · SpotImage · ImageFullscreenModal"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Placeholder canónico; SpotImage (carga + error → placeholder); lightbox a pantalla completa. Vitrina: ImagesShowcase."
        >
          <ImagesShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-mapa-filters"
          title="MapPinFilter · MapPinFilterInline"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Las filas del menú desplegable son MapPinFilterMenuOption (hijo interno de MapPinFilter). Cuatro bloques: chip, inline compacto, inline amplio, y amplio con saved=0 (Por visitar deshabilitado, sin badge). El estado `MapPinFilterValue` se muestra bajo cada bloque al pulsar."
        >
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 }}>
              {DS_MAP_FILTER_VERSION.chip}
            </Text>
            <MapPinFilter
              value={dsMapFilterChip}
              onChange={setDsMapFilterChip}
              counts={{ saved: 3, visited: 7 }}
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Estado:{' '}
              <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.text }}>
                {dsMapFilterChip}
              </Text>
            </Text>
          </View>
          <View style={{ marginTop: Spacing.lg, width: '100%', maxWidth: 360, gap: Spacing.sm }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 }}>
              {DS_MAP_FILTER_VERSION.inlineCompact}
            </Text>
            <MapPinFilterInline
              value={dsMapFilterInlineCompact}
              onChange={setDsMapFilterInlineCompact}
              counts={{ saved: 3, visited: 7 }}
              layout="compact"
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Estado:{' '}
              <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.text }}>
                {dsMapFilterInlineCompact}
              </Text>
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                letterSpacing: 0.3,
                marginTop: Spacing.sm,
              }}
            >
              {DS_MAP_FILTER_VERSION.inlineWide}
            </Text>
            <MapPinFilterInline
              value={dsMapFilterInlineWide}
              onChange={setDsMapFilterInlineWide}
              counts={{ saved: 3, visited: 7 }}
              layout="wide"
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Estado:{' '}
              <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.text }}>
                {dsMapFilterInlineWide}
              </Text>
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                letterSpacing: 0.3,
                marginTop: Spacing.sm,
              }}
            >
              {DS_MAP_FILTER_VERSION.inlineDisabled}
            </Text>
            <MapPinFilterInline
              value={dsMapFilterInlineDisabled}
              onChange={setDsMapFilterInlineDisabled}
              counts={{ saved: 0, visited: 7 }}
              layout="wide"
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: Spacing.xs }}>
              Estado:{' '}
              <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.text }}>
                {dsMapFilterInlineDisabled}
              </Text>
            </Text>
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-mapa-search"
          title="Búsqueda en mapa — SearchInputV2 (embebido)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Runtime en SearchSurface; aquí solo forma pill + foco + clear. Máximo ancho alineado a WR-01."
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              flexDirection: 'row',
              alignItems: 'center',
              height: 44,
              paddingLeft: Spacing.base,
              paddingRight: Spacing.sm,
              gap: Spacing.sm,
              borderRadius: 22,
              borderWidth: dsSearchFocused ? 2 : 1,
              borderColor: dsSearchFocused ? colors.tint : colors.borderSubtle,
              backgroundColor: colors.background,
            }}
          >
            <Search size={20} color={colors.textSecondary} strokeWidth={2} />
            <SearchInputV2
              value={dsSearchQuery}
              onChangeText={setDsSearchQuery}
              onClear={() => setDsSearchQuery('')}
              embedded
              placeholder="Busca en el mapa"
              onFocus={() => setDsSearchFocused(true)}
              onBlur={() => setDsSearchFocused(false)}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-mapa-pins"
          title="Map pins"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Mapa claro (Explore). Ubicación; default plain vs flowya_unlinked (sin POI); matriz reposo/seleccionado × estados; Create (creando / existente). Tokens theme.mapPinSpot y capas Mapbox."
        >
          <MapPinsShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-toast"
          title="System status — toast (useSystemStatus)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Default = neutro invertido; success/error = tokens stateSuccess/stateError + icono. Anclaje inferior en Explore: SYSTEM_STATUS_TOAST §2. setAnchor coalescido por rAF (§2.3)."
        >
          <Text style={{ color: colors.textSecondary, marginBottom: Spacing.md, fontSize: 13, lineHeight: 18 }}>
            Los botones disparan el toast real del provider (arriba o según ancla). Variantes alineadas con OL-SYSTEM-TOAST-SEMANTIC-STABLE-001.
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
            <Pressable
              style={({ pressed }) => ({
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                borderRadius: Radius.md,
                backgroundColor: colors.text,
                opacity: pressed ? 0.88 : 1,
              })}
              onPress={() => toast.show('Mensaje por defecto', { type: 'default' })}
            >
              <Text style={{ color: colors.background, fontWeight: '600' }}>Default</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                borderRadius: Radius.md,
                backgroundColor: colors.stateSuccess,
                opacity: pressed ? 0.88 : 1,
              })}
              onPress={() => toast.show('Acción correcta', { type: 'success', replaceVisible: true })}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Success + replace</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                borderRadius: Radius.md,
                backgroundColor: colors.stateError,
                opacity: pressed ? 0.92 : 1,
              })}
              onPress={() => toast.show('Algo salió mal', { type: 'error' })}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Error</Text>
            </Pressable>
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-explore-countries-flows-pill"
          title="Explore — ExploreCountriesFlowsPill (países | flows)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Pastilla «N países | M flows» con un solo chevron al extremo derecho (primario si activo). 0 países visitados = deshabilitado. Abre el sheet de visitados. Import: @/components/design-system/explore-countries-flows-pill."
        >
          <Text style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>Activo (sheet visitados)</Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '100%',
              maxWidth: 520,
              padding: Spacing.base,
              borderRadius: Radius.lg,
              backgroundColor: colorScheme === 'dark' ? 'rgba(28,28,30,0.82)' : 'rgba(135, 206, 235, 0.35)',
            }}
          >
            <ExploreCountriesFlowsPill
              countriesCount={14}
              flowsPoints={2560}
              onPress={() => {}}
              accessibilityLabel="Abrir países visitados"
            />
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            Deshabilitado (0 países visitados)
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '100%',
              maxWidth: 520,
              padding: Spacing.base,
              borderRadius: Radius.lg,
              backgroundColor: colorScheme === 'dark' ? 'rgba(28,28,30,0.82)' : 'rgba(135, 206, 235, 0.35)',
            }}
          >
            <ExploreCountriesFlowsPill countriesCount={0} flowsPoints={0} />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-countries-kpi"
          title="Países — CountriesSheetKpiRow"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Tres chips (países · lugares · flows) del sheet de países. Usado en CountriesSheet. Import: @/components/design-system/countries-sheet-kpi-row."
        >
          <View
            style={{
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.xs,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: colors.countriesPanelToVisitBorderSubtle,
              backgroundColor: colors.countriesPanelToVisitBackgroundElevated,
              maxWidth: 520,
              alignSelf: 'stretch',
            }}
          >
            <CountriesSheetKpiRow
              filterMode="saved"
              summaryCountriesCount={12}
              summaryPlacesCount={48}
              pointsLabel={dsCountriesDemoPointsLabel}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                primary: colors.primary,
                borderSubtle: colors.countriesPanelToVisitBorderSubtle,
                background: colors.countriesPanelToVisitBackground,
                backgroundElevated: colors.countriesPanelToVisitBackgroundElevated,
              }}
              onCountriesKpiPress={() => {}}
              onSpotsKpiPress={() => {}}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-countries-map-preview"
          title="Países — CountriesMapPreview"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Mini mapa de países (vector world + resaltado ISO). Web: implementación en countries-map-preview.web. Import: @/components/design-system/countries-map-preview."
        >
          <View style={{ maxWidth: WEB_SHEET_MAX_WIDTH, alignSelf: 'stretch', borderRadius: Radius.lg, overflow: 'hidden' }}>
            <CountriesMapPreview
              countryCodes={['MX', 'ES', 'FR']}
              height={176}
              highlightColor={colors.stateToVisit}
              forceColorScheme={colorScheme === 'dark' ? 'dark' : 'light'}
              baseCountryColor={colors.countriesMapCountryBaseToVisit}
              lineCountryColor={colors.countriesMapCountryLineToVisit}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-countries-visited-progress"
          title="Países — CountriesSheetVisitedProgress"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Progreso % mundo y nivel (solo filtro visitados). Import: @/components/design-system/countries-sheet-visited-progress."
        >
          <View
            style={{
              paddingTop: Spacing.sm,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: colors.countriesPanelVisitedBorderSubtle,
              backgroundColor: colors.countriesPanelVisitedBackgroundElevated,
              maxWidth: 520,
              alignSelf: 'stretch',
            }}
          >
            <CountriesSheetVisitedProgress
              worldPercentage={18}
              levelLabel={dsCountriesDemoLevel.label}
              levelIndex={dsCountriesDemoLevel.level}
              currentTravelerPoints={dsCountriesDemoTravelerPoints}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                primary: colors.primary,
                borderSubtle: colors.countriesPanelVisitedBorderSubtle,
                stateSuccess: colors.stateSuccess,
              }}
              onPressLevels={() => {}}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-countries-list"
          title="Países — CountriesSheetCountryList"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Filas del listado expandido (tap → búsqueda por país). Import: @/components/design-system/countries-sheet-country-list."
        >
          <View
            style={{
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: colors.countriesPanelVisitedBorderSubtle,
              backgroundColor: colors.countriesPanelVisitedBackgroundElevated,
              maxWidth: 520,
              alignSelf: 'stretch',
            }}
          >
            <CountriesSheetCountryList
              items={DS_MOCK_COUNTRY_ITEMS.slice(0, 4)}
              onItemPress={() => {}}
              maxHeight={200}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                primary: colors.primary,
              }}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-traveler-levels-list"
          title="Exploración — TravelerLevelsList"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Listado canónico de niveles (rango de pts por fila). Datos: TRAVELER_LEVELS en lib/traveler-levels. Import: @/components/design-system/traveler-levels-list."
        >
          <View
            style={{
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              backgroundColor: colors.backgroundElevated,
              maxWidth: WEB_MODAL_CARD_MAX_WIDTH,
              alignSelf: 'stretch',
              maxHeight: 320,
              overflow: 'hidden',
            }}
          >
            <TravelerLevelsList
              currentLevel={dsCountriesDemoLevel}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                rowCurrentBackground: colors.background,
              }}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-comp-sheet-handle"
          title="SheetHandle"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Agarre para sheets (mapa / listados). Componente atómico; no incluye contenido de tarjeta ni detalle de spot. Import: @/components/design-system/sheet-handle."
        >
          <View style={{ alignItems: 'center', maxWidth: WEB_SHEET_MAX_WIDTH, alignSelf: 'stretch' }}>
            <SheetHandle onPress={() => {}} />
          </View>
        </DesignSystemSection>

        <DesignSystemGroupHeading
          id="ds-group-templates"
          title="Templates"
          textColor={colors.text}
          onLayoutY={registerY}
        />

        <DesignSystemSection
          id="ds-mapa-picker"
          title="MapLocationPicker"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
        >
          <View style={{ height: 320, borderRadius: Radius.md, overflow: 'hidden' }}>
            <MapLocationPicker onConfirm={() => {}} onCancel={() => {}} />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-tpl-spot-detail"
          title="Spot Detail — pantalla completa"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Plantilla de detalle de lugar (hero, acciones, mapa, contenido). En app ocupa la vista; aquí embebida con altura fija para la vitrina."
        >
          <SpotDetailShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-tpl-explore-welcome"
          title="Explore — sheet de bienvenida (peek / medium / expanded)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Una sola ExploreWelcomeSheet (runtime ExploreChromeShell). El recuadro alto simula mapa + sheet: arrastra el handle para recorrer peek, medium y expanded. Snap compartido con CountriesSheet: EXPLORE_CHROME_SHELL.md §5."
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Lista: {dsTplWelcomeEmptyList ? 'vacía (cold-start)' : 'con ítems de ejemplo'}
            </Text>
            <Pressable
              onPress={() => setDsTplWelcomeEmptyList((v) => !v)}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: Spacing.sm,
                borderRadius: Radius.sm,
                backgroundColor: pressed ? colors.stateSurfacePressed : colors.borderSubtle,
              })}
              accessibilityRole="button"
              accessibilityLabel={
                dsTplWelcomeEmptyList ? 'Mostrar lista con ítems de ejemplo' : 'Mostrar lista vacía'
              }
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                {dsTplWelcomeEmptyList ? 'Ver con ítems' : 'Ver vacía'}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              position: 'relative',
              height: dsWelcomeStageHeight,
              width: '100%',
              maxWidth: WEB_SHEET_MAX_WIDTH,
              alignSelf: 'center',
              borderRadius: Radius.lg,
              overflow: 'hidden',
              backgroundColor: colorScheme === 'dark' ? 'rgba(36, 58, 72, 0.55)' : 'rgba(100, 149, 180, 0.35)',
            }}
          >
            <ExploreWelcomeSheet
              visible
              state={dsTplWelcomeState}
              onStateChange={setDsTplWelcomeState}
              onSearchPress={() => {}}
              browseItems={dsTplWelcomeEmptyList ? [] : DS_EXPLORE_WELCOME_MOCK_ITEMS}
              onBrowseItemPress={() => {}}
              bottomOffset={0}
              userCoords={{ latitude: 41.4, longitude: 2.17 }}
            />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-explore-countries-template"
          title="Países — plantilla completa (KPI + mapa + lista)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Composición de runtime vía CountriesSheetTemplateDemo: SpotSheetHeader, CountriesSheetKpiRow, CountriesMapPreview, CountriesSheetVisitedProgress (visitados), CountriesSheetCountryList. Piezas sueltas en Componentes. En Explore el snapshot del mapa alimenta compartir."
        >
          <Text style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>Por visitar</Text>
          <CountriesSheetTemplateDemo filterMode="saved" />
          <Text style={{ color: colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Visitados</Text>
          <CountriesSheetTemplateDemo filterMode="visited" />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-explore-countries-share"
          title="Países — imagen para compartir"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="PNG generado por shareCountriesCard (lib/share-countries-card): título, KPI, mapa si hay snapshot, top países y marca. Sin snapshot el mapa se muestra como bloque vacío."
        >
          <ShareCountriesCardShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-pat-explore"
          title="Explore — banda inferior (productivo)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Chrome alineado a MapScreen (`ExploreChromeShell`; ver EXPLORE_CHROME_SHELL.md): **perfil** arriba a la izquierda (`ExploreMapProfileButton`); fila FLOWYA + pastilla (`ExploreMapStatusRow`); **buscador canónico** solo launcher (`ExploreChromeSearchField`, `fullWidth` / `WEB_SHEET_MAX_WIDTH`). Tap en perfil abre cuenta (`/account`). FLOWYA abre el modal beta de la vitrina."
        >
          <View
            style={{
              width: '100%',
              maxWidth: WEB_SHEET_MAX_WIDTH,
              padding: Spacing.base,
              borderRadius: Radius.xl,
              backgroundColor: colorScheme === 'dark' ? 'rgba(28,28,30,0.82)' : 'rgba(0,0,0,0.32)',
              gap: Spacing.sm,
            }}
          >
            <ExploreMapProfileButton onPress={() => {}} isAuthUser />
            <ExploreMapStatusRow
              onFlowyaPress={() => setShowBetaModal(true)}
              flowsBadge={{
                countriesCount: 14,
                flowsPoints: 2560,
                onPress: () => {},
                accessibilityLabel: 'Abrir países visitados',
              }}
            />
            <ExploreChromeSearchField fullWidth onSearchPress={() => {}} />
          </View>
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-pat-modales"
          title="Modales — auth · confirm · beta"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="ConfirmModal y FlowyaBetaModal viven en components/ui; reexport en barrel. El modal de niveles de exploración está en la ancla siguiente (ds-modal-explorer-levels)."
        >
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
            title="¿Eliminar este lugar?"
            message="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            variant="destructive"
            onConfirm={() => setShowDeleteSpotConfirm(false)}
            onCancel={() => setShowDeleteSpotConfirm(false)}
          />
          <FlowyaBetaModal visible={showBetaModal} onClose={() => setShowBetaModal(false)} />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-modal-explorer-levels"
          title="Modales — Niveles de exploración"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Mismo modal que CountriesSheet al abrir niveles. Import: @/components/design-system/traveler-levels-modal (usa TravelerLevelsList)."
        >
          <Pressable
            style={({ pressed }) => ({
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: Radius.md,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
              alignSelf: 'flex-start',
            })}
            onPress={() => setShowTravelerLevelsModal(true)}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Abrir Niveles de exploración</Text>
          </Pressable>
          <TravelerLevelsModal
            visible={showTravelerLevelsModal}
            onClose={() => setShowTravelerLevelsModal(false)}
            currentLevel={dsCountriesDemoLevel}
            colors={{
              text: colors.text,
              textSecondary: colors.textSecondary,
              background: colors.background,
              backgroundElevated: colors.backgroundElevated,
              borderSubtle: colors.borderSubtle,
            }}
          />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-run-explore-filter-chips"
          title="Explore — chips de etiquetas (OR) y país"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Contrato DS: `ExploreTagFilterChipRow` (varias etiquetas = OR) y `ExploreCountryFilterChipRow` (un país o todos; tokens café/tierra). Mismos hints que el modal de filtros y la superficie de búsqueda. Import: @/components/design-system/explore-filter-chips-showcase."
        >
          <ExploreFilterChipsShowcase />
        </DesignSystemSection>

        <DesignSystemSection
          id="ds-run-surface"
          title="Superficie de búsqueda (SearchSurface)"
          titleColor={titleMuted}
          mutedColor={colors.textSecondary}
          cardStyle={sectionCard}
          onLayoutY={registerY}
          description="Orquesta buscador, MapPinFilterInline, hint OR + fila de chips de etiquetas (Por visitar/Visitados) y listados con SearchListCard (distancia, imagen de portada, visitado con CTA imagen/nota como en MapScreen). Runtime: SearchFloating → SearchSurface. Chips aislados: sección **ds-run-explore-filter-chips**. Import vitrina: @/components/design-system/search-surface-showcase."
        >
          <SearchSurfaceShowcase />
        </DesignSystemSection>

        <View style={styles.footer}>
          <Link href="/" asChild>
            <Text style={{ ...styles.backLink, color: colors.tint }}>← Volver al mapa</Text>
          </Link>
        </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  shellRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
  },
  shellRowNarrow: {
    flexDirection: 'column',
  },
  sidebar: {
    width: DS_SIDEBAR_W,
    borderRightWidth: 1,
    flexShrink: 0,
  },
  sidebarScroll: {
    flexGrow: 0,
  },
  sidebarScrollContent: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sidebarHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  sidebarHint: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: Spacing.md,
  },
  scrollMain: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  tocMobileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  tocMobileTriggerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  tocMobileTriggerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tocMobileTriggerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  modalOuter: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalPanel: {
    maxHeight: '82%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Spacing.lg,
  },
  modalPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  modalPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalPanelScroll: {
    maxHeight: 480,
    paddingHorizontal: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.lg,
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
  footer: {
    marginTop: Spacing.xl,
  },
  backLink: {
    fontSize: 17,
    fontWeight: '500',
  },
});
