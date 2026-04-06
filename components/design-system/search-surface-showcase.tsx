import type { MapPinFilterValue } from '@/components/design-system/map-pin-filter';
import type { SearchListCardProps } from '@/components/design-system/search-list-card';
import { SearchListCard } from '@/components/design-system/search-list-card';
import { SearchSurface } from '@/components/search/SearchSurface';
import type { SearchSection } from '@/components/search/SearchResultsListV2';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSearchControllerV2 } from '@/hooks/search/useSearchControllerV2';
import { distanceKm, formatDistanceKm } from '@/lib/geo-utils';
import { WEB_SEARCH_OVERLAY_MAX_WIDTH } from '@/lib/web-layout';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Referencia fija (CDMX) para demostrar `distanceText` como en runtime con `userCoords`. */
const DEMO_USER_REF = { lat: 19.4326, lng: -99.1332 };

const DEMO_COVER_CAFE =
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80&auto=format';
const DEMO_COVER_MARKET =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80&auto=format';

type DemoSpot = {
  id: string;
  title: string;
  address: string | null;
  latitude: number;
  longitude: number;
  pinStatus: 'to_visit' | 'visited';
  tagIds: string[];
  cover_image_url?: string | null;
  description_short?: string | null;
  linked_maki?: string | null;
};

/** Metadatos de etiquetas como en runtime (conteos para chips de fila). */
const TAG_META: { id: string; name: string; count: number }[] = [
  { id: 'tag-ruta', name: 'ruta', count: 3 },
  { id: 'tag-2026', name: '2026', count: 2 },
];

const DEMO_SPOTS: DemoSpot[] = [
  {
    id: 'ds-surf-1',
    title: 'Café central',
    address: 'Ciudad de México',
    latitude: 19.4326,
    longitude: -99.1332,
    pinStatus: 'to_visit',
    tagIds: ['tag-ruta', 'tag-2026'],
    linked_maki: 'cafe',
  },
  {
    id: 'ds-surf-2',
    title: 'Librería Sur',
    address: 'Roma',
    latitude: 19.4195,
    longitude: -99.1619,
    pinStatus: 'to_visit',
    tagIds: ['tag-ruta'],
    cover_image_url: DEMO_COVER_CAFE,
  },
  {
    id: 'ds-surf-3',
    title: 'Mercado histórico',
    address: 'Centro',
    latitude: 19.428,
    longitude: -99.14,
    pinStatus: 'visited',
    tagIds: ['tag-ruta'],
    cover_image_url: DEMO_COVER_MARKET,
    description_short: 'Desayuno los domingos.',
  },
  {
    id: 'ds-surf-4',
    title: 'Mirador norte',
    address: null,
    latitude: 19.45,
    longitude: -99.12,
    pinStatus: 'visited',
    tagIds: ['tag-2026'],
  },
  {
    id: 'ds-surf-5',
    title: 'Pin cercano',
    address: 'Cerca del punto de referencia',
    latitude: 19.4345,
    longitude: -99.134,
    pinStatus: 'to_visit',
    tagIds: [],
  },
];

const noopStrategy = async () =>
  Promise.resolve({ items: [] as DemoSpot[], nextCursor: null, hasMore: false });

function buildVisitedQuickActions(
  spot: DemoSpot,
  pinFilter: MapPinFilterValue,
): NonNullable<SearchListCardProps['quickActions']> {
  if (pinFilter !== 'visited' || spot.pinStatus !== 'visited') return [];
  const hasCover = Boolean(spot.cover_image_url?.trim());
  const hasDesc = (spot.description_short?.trim() ?? '').length > 0;
  const actions: NonNullable<SearchListCardProps['quickActions']> = [
    {
      id: `add-tag-${spot.id}`,
      label: 'Etiquetar',
      kind: 'add_tag',
      onPress: () => {},
      accessibilityLabel: `Etiquetar ${spot.title}`,
    },
  ];
  if (!hasCover) {
    actions.push({
      id: `add-image-${spot.id}`,
      label: 'Agregar imagen',
      kind: 'add_image',
      onPress: () => {},
      accessibilityLabel: `Agregar imagen a ${spot.title}`,
    });
  }
  if (!hasDesc) {
    actions.push({
      id: `edit-desc-${spot.id}`,
      label: 'Escribir nota breve',
      kind: 'edit_description',
      onPress: () => {},
      accessibilityLabel: `Escribir una nota breve sobre ${spot.title}`,
    });
  }
  return actions;
}

/**
 * Vitrina web: `SearchSurface` + `SearchListCard` (mismo contrato que MapScreen/SearchResultCard).
 * Distancia simulada, secciones con imagen de portada y filtro Visitados con CTA imagen/nota.
 */
export function SearchSurfaceShowcase() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>('all');
  const [selectedTagFilterId, setSelectedTagFilterId] = useState<string | null>(null);
  const [tagEditMode, setTagEditMode] = useState(false);

  const controller = useSearchControllerV2<DemoSpot>({
    mode: 'spots',
    strategy: noopStrategy,
    getFilters: () => ({ pinFilter }),
    defaultOpen: true,
  });

  const tagFilterOptions = useMemo(() => {
    if (pinFilter !== 'saved' && pinFilter !== 'visited') return undefined;
    return TAG_META;
  }, [pinFilter]);

  const filterByTag = useCallback((items: DemoSpot[]) => {
    if (selectedTagFilterId == null) return items;
    return items.filter((s) => s.tagIds.includes(selectedTagFilterId));
  }, [selectedTagFilterId]);

  const defaultItemSections = useMemo((): SearchSection<DemoSpot>[] => {
    const byId = Object.fromEntries(DEMO_SPOTS.map((s) => [s.id, s]));
    const pick = (...ids: string[]) => filterByTag(ids.map((id) => byId[id]).filter(Boolean) as DemoSpot[]);

    if (pinFilter === 'all') {
      return [
        { id: 'sec-dist', title: 'Distancia al spot', items: pick('ds-surf-1', 'ds-surf-5') },
        { id: 'sec-cover', title: 'Con imagen de portada', items: pick('ds-surf-2', 'ds-surf-3') },
        { id: 'sec-more', title: 'Más lugares', items: pick('ds-surf-4') },
      ].filter((s) => s.items.length > 0);
    }
    if (pinFilter === 'saved') {
      return [
        {
          id: 'pv',
          title: 'Por visitar — distancia, imagen y chips',
          items: pick('ds-surf-1', 'ds-surf-5', 'ds-surf-2'),
        },
      ].filter((s) => s.items.length > 0);
    }
    return [
      { id: 'v-ok', title: 'Con imagen o nota', items: pick('ds-surf-3') },
      { id: 'v-empty', title: 'Sin foto ni nota (acciones rápidas)', items: pick('ds-surf-4') },
    ].filter((s) => s.items.length > 0);
  }, [pinFilter, filterByTag]);

  const renderItem = useCallback(
    (item: DemoSpot) => {
      const labelById = Object.fromEntries(TAG_META.map((t) => [t.id, t.name]));
      const tagChips = item.tagIds.map((id) => ({ id, label: labelById[id] ?? id }));
      const km = distanceKm(DEMO_USER_REF.lat, DEMO_USER_REF.lng, item.latitude, item.longitude);
      const distanceText = formatDistanceKm(km);
      const isVisitedFilter = pinFilter === 'visited';
      const descriptionShort = item.description_short?.trim() ?? '';
      const hasDescriptionShort = descriptionShort.length > 0;
      const subtitle =
        isVisitedFilter && item.pinStatus === 'visited'
          ? hasDescriptionShort
            ? descriptionShort
            : null
          : item.address;
      const quickActions = buildVisitedQuickActions(item, pinFilter);
      return (
        <SearchListCard
          title={item.title}
          subtitle={subtitle}
          imageUri={item.cover_image_url}
          maki={item.linked_maki ?? undefined}
          onPress={() => {}}
          accessibilityLabel={item.title}
          pinStatus={item.pinStatus}
          distanceText={distanceText}
          tagChips={tagChips}
          quickActions={quickActions}
        />
      );
    },
    [pinFilter],
  );

  return (
    <View style={[styles.outer, { padding: Spacing.xl }]}>
      <View
        style={[
          styles.shell,
          {
            height: 620,
            maxWidth: WEB_SEARCH_OVERLAY_MAX_WIDTH,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            borderRadius: Radius.lg,
            backgroundColor: colors.background,
            overflow: 'hidden',
            padding: Spacing.base,
          },
        ]}
      >
        <View style={styles.shellInner}>
          <SearchSurface<DemoSpot>
            controller={controller}
            defaultItems={[]}
            defaultItemSections={defaultItemSections}
            recentQueries={[]}
            recentViewedItems={[]}
            renderItem={renderItem}
            stageLabel="Vitrina DS"
            onClosePress={() => {}}
            pinFilter={pinFilter}
            pinCounts={{ saved: 3, visited: 2 }}
            onPinFilterChange={setPinFilter}
            tagFilterOptions={tagFilterOptions}
            selectedTagFilterId={selectedTagFilterId}
            onTagFilterChange={setSelectedTagFilterId}
            tagFilterEditMode={tagEditMode}
            onTagFilterEnterEditMode={() => setTagEditMode(true)}
            onTagFilterExitEditMode={() => setTagEditMode(false)}
            onRequestDeleteUserTag={() => setTagEditMode(false)}
            insets={{ top: 0, bottom: 0 }}
            getItemKey={(item) => item.id}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'center',
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
  },
  /** Padding interior (`Spacing.base`) reduce el área útil; flex para listados/scroll en SearchSurface. */
  shellInner: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
});
