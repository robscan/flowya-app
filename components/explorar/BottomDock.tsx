/**
 * BottomDock — Pill de búsqueda (o cluster perfil+crear+pill cuando showProfile/showCreateSpot).
 * Modo pillOnly: solo SearchPill flotante, sin contenedor envolvente.
 */

import { IconButton } from '@/components/design-system/icon-button';
import { SearchPill } from '@/components/design-system/search-pill';
import { Colors, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogOut, Plus, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export const DOCK_HEIGHT = 66;

const CLUSTER_BORDER_RADIUS = 999;
const PROFILE_BUTTON_SIZE = 44;
const CLUSTER_PADDING = 8;
const CLUSTER_MARGIN_H = 16;
const PILL_MARGIN_H = 16;
export type BottomDockInsets = {
  bottom: number;
};

export type BottomDockProps = {
  onOpenSearch: () => void;
  onProfilePress?: () => void;
  /** CTA primario crear spot. Si se proporciona y showCreateSpot, se muestra botón (+). */
  onCreateSpot?: () => void;
  isAuthUser?: boolean;
  dockVisible: boolean;
  bottomOffset: number;
  insets: BottomDockInsets;
  showLogoutPopover?: boolean;
  onLogoutPress?: () => void;
  /** Si false, no muestra perfil (por defecto true). */
  showProfile?: boolean;
  /** Si false, no muestra botón crear spot (por defecto true cuando onCreateSpot). */
  showCreateSpot?: boolean;
};

export function BottomDock({
  onOpenSearch,
  onProfilePress,
  onCreateSpot,
  isAuthUser = false,
  dockVisible,
  bottomOffset,
  insets,
  showLogoutPopover = false,
  onLogoutPress,
  showProfile = true,
  showCreateSpot = true,
}: BottomDockProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!dockVisible) return null;

  const bottom = bottomOffset + insets.bottom;
  const pillOnly = !showProfile && !showCreateSpot;

  if (pillOnly) {
    return (
      <View style={[styles.outer, { bottom, pointerEvents: 'box-none', paddingHorizontal: PILL_MARGIN_H }]}>
        <SearchPill onPress={onOpenSearch} variant="onDark" />
      </View>
    );
  }

  return (
    <View style={[styles.outer, { bottom, pointerEvents: 'box-none' }]}>
      <View
        style={[
          styles.cluster,
          {
            backgroundColor:
              colorScheme === 'dark'
                ? 'rgba(40, 40, 42, 0.94)'
                : 'rgba(28, 28, 30, 0.92)',
            borderColor: 'rgba(255,255,255,0.12)',
            ...Shadow.card,
          },
        ]}
      >
        {showProfile && onProfilePress != null ? (
          <View style={styles.profileWrap}>
            {showLogoutPopover && onLogoutPress ? (
              <View style={styles.logoutPopover}>
                <IconButton
                  variant="default"
                  size={PROFILE_BUTTON_SIZE}
                  onPress={onLogoutPress}
                  accessibilityLabel="Cerrar sesión"
                >
                  <LogOut size={22} color={colors.stateError} strokeWidth={2} />
                </IconButton>
              </View>
            ) : null}
            <IconButton
              variant="default"
              size={PROFILE_BUTTON_SIZE}
              onPress={onProfilePress}
              accessibilityLabel="Cuenta"
            >
              <User
                size={24}
                color={isAuthUser ? colors.primary : colors.text}
                strokeWidth={2}
              />
            </IconButton>
          </View>
        ) : null}
        {showCreateSpot && onCreateSpot != null ? (
          <IconButton
            variant="default"
            size={PROFILE_BUTTON_SIZE}
            onPress={onCreateSpot}
            accessibilityLabel="Crear spot"
          >
            <Plus size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
        ) : null}
        <View style={styles.pillWrap}>
          <SearchPill onPress={onOpenSearch} fill variant="onDark" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 12,
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: CLUSTER_MARGIN_H,
    padding: CLUSTER_PADDING,
    borderRadius: CLUSTER_BORDER_RADIUS,
    borderWidth: 1,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  profileWrap: {
    position: 'relative',
  },
  logoutPopover: {
    position: 'absolute',
    bottom: PROFILE_BUTTON_SIZE + 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 13,
  },
  pillWrap: {
    flex: 1,
  },
});
