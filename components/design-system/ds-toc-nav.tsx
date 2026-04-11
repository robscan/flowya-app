import { ChevronDown, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

export type DsTocItem = { id: string; label: string };

export type DsTocGroup = {
  key: string;
  title: string;
  items: DsTocItem[];
};

/** Fuente única de verdad del índice: cada `item.id` = `nativeID` en `app/design-system.web.tsx`. */
export const DS_TOC_GROUPS: DsTocGroup[] = [
  {
    key: 'intro',
    title: 'Intro',
    items: [
      { id: 'ds-top', label: 'Inicio' },
      { id: 'ds-intro', label: 'Alcance y contratos' },
    ],
  },
  {
    key: 'primitivos',
    title: 'Primitivos',
    items: [
      { id: 'ds-fund-colors', label: 'Paleta' },
      { id: 'ds-fund-typography', label: 'Tipografía' },
      { id: 'ds-fund-spacing', label: 'Espaciado' },
      { id: 'ds-fund-radius', label: 'Radio' },
      { id: 'ds-fund-elevation', label: 'Elevación' },
      { id: 'ds-fund-layout', label: 'Layout WR-01' },
    ],
  },
  {
    key: 'componentes',
    title: 'Componentes',
    items: [
      { id: 'ds-act-buttons-showcase', label: 'Botones primario / secundario' },
      { id: 'ds-comp-icon-button', label: 'IconButton' },
      { id: 'ds-comp-clear-icon-circle', label: 'ClearIconCircle' },
      { id: 'ds-list-tag', label: 'TagChip' },
      { id: 'ds-list-rows', label: 'SearchListCard' },
      { id: 'ds-medios', label: 'Imágenes y fullscreen' },
      { id: 'ds-mapa-filters', label: 'Filtros mapa' },
      { id: 'ds-mapa-search', label: 'SearchInputV2' },
      { id: 'ds-mapa-pins', label: 'Map pins' },
      { id: 'ds-comp-toast', label: 'System status (toast)' },
      { id: 'ds-comp-explore-countries-flows-pill', label: 'Explore — países | flows' },
      { id: 'ds-comp-countries-kpi', label: 'Países — KPI' },
      { id: 'ds-comp-countries-map-preview', label: 'Países — mapa preview' },
      { id: 'ds-comp-countries-visited-progress', label: 'Países — progreso visitados' },
      { id: 'ds-comp-countries-list', label: 'Países — lista' },
      { id: 'ds-comp-traveler-levels-list', label: 'Exploración — niveles (lista)' },
      { id: 'ds-comp-sheet-handle', label: 'SheetHandle' },
    ],
  },
  {
    key: 'templates',
    title: 'Templates',
    items: [
      { id: 'ds-mapa-picker', label: 'MapLocationPicker' },
      { id: 'ds-tpl-spot-detail', label: 'Spot Detail (pantalla completa)' },
      { id: 'ds-tpl-explore-welcome', label: 'Explore — sheet bienvenida' },
      { id: 'ds-explore-countries-template', label: 'Países — sheet + mapa' },
      { id: 'ds-explore-countries-share', label: 'Países — compartir' },
      { id: 'ds-pat-explore', label: 'Explore: banda inferior' },
      { id: 'ds-pat-modales', label: 'Modales' },
      { id: 'ds-modal-explorer-levels', label: 'Modales: niveles' },
      { id: 'ds-run-surface', label: 'SearchSurface' },
    ],
  },
];

export function buildInitialTocExpanded(groups: DsTocGroup[]): Record<string, boolean> {
  return Object.fromEntries(groups.map((g) => [g.key, false]));
}

/** Lista plana de anclas del TOC (útil para comprobar cobertura frente al DOM). */
export function flattenDsTocAnchorIds(groups: DsTocGroup[] = DS_TOC_GROUPS): string[] {
  return groups.flatMap((g) => g.items.map((i) => i.id));
}

export type DsTocNavProps = {
  groups: DsTocGroup[];
  expanded: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  onNavigate: (id: string) => void;
  /** Rail estrecho vs panel modal (más aire en modal). */
  variant: 'sidebar' | 'modal';
  colorScheme: 'light' | 'dark' | null | undefined;
};

export function DsTocNav({ groups, expanded, onToggleGroup, onNavigate, variant, colorScheme }: DsTocNavProps) {
  const colors = Colors[colorScheme ?? 'light'];
  const isModal = variant === 'modal';

  return (
    <View style={isModal ? styles.modalWrap : undefined}>
      {groups.map((group, groupIndex) => {
        const isOpen = expanded[group.key] ?? false;
        return (
          <View key={group.key} style={styles.groupBlock}>
            {groupIndex > 0 ? <View style={[styles.groupRule, { backgroundColor: colors.borderSubtle }]} /> : null}
            <Pressable
              onPress={() => onToggleGroup(group.key)}
              style={({ pressed }) => [
                styles.groupHeader,
                isModal && styles.groupHeaderModal,
                { backgroundColor: pressed ? colors.stateSurfacePressed : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${group.title}. ${isOpen ? 'Contraer' : 'Expandir'} sección`}
            >
              {isOpen ? (
                <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2.2} />
              ) : (
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2.2} />
              )}
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {group.title}
              </Text>
            </Pressable>
            {isOpen ? (
              <View
                style={[
                  styles.itemsWrap,
                  isModal && styles.itemsWrapModal,
                  { borderLeftColor: colors.borderSubtle },
                ]}
              >
                {group.items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onNavigate(item.id)}
                    style={({ pressed }) => [
                      styles.itemLink,
                      isModal && styles.itemLinkModal,
                      {
                        backgroundColor: pressed ? colors.stateSurfacePressed : 'transparent',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ir a ${item.label}`}
                  >
                    <Text style={[styles.itemLabel, { color: colors.text }]} numberOfLines={4}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  modalWrap: {
    paddingBottom: Spacing.sm,
  },
  groupBlock: {
    marginBottom: Spacing.xs,
  },
  groupRule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    opacity: 0.85,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
  },
  groupHeaderModal: {
    paddingVertical: Spacing.sm + 2,
  },
  groupTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  itemsWrap: {
    paddingLeft: Spacing.sm + 2,
    borderLeftWidth: 1,
    marginLeft: 7,
    marginBottom: Spacing.xs,
  },
  itemsWrapModal: {
    paddingLeft: Spacing.md,
    marginLeft: 8,
  },
  itemLink: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: 1,
  },
  itemLinkModal: {
    paddingVertical: Spacing.sm,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
