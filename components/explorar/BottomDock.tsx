/**
 * BottomDock — Cluster flotante estilo Apple Maps (Explorar vNext).
 * Perfil a la izquierda, Search pill a la derecha. Logout popover encima del perfil.
 */

import { IconButton } from '@/components/design-system/icon-button';
import { Colors, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogOut, Search, User } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export const DOCK_HEIGHT = 66;

const CLUSTER_BORDER_RADIUS = 999;
const PILL_BORDER_RADIUS = 25;
const PILL_HEIGHT = 50;
const PROFILE_BUTTON_SIZE = 44;
const CLUSTER_PADDING = 8;
const CLUSTER_MARGIN_H = 16;
export type BottomDockInsets = {
  bottom: number;
};

export type BottomDockProps = {
  onOpenSearch: () => void;
  onProfilePress: () => void;
  isAuthUser: boolean;
  dockVisible: boolean;
  bottomOffset: number;
  insets: BottomDockInsets;
  showLogoutPopover?: boolean;
  onLogoutPress?: () => void;
};

export function BottomDock({
  onOpenSearch,
  onProfilePress,
  isAuthUser,
  dockVisible,
  bottomOffset,
  insets,
  showLogoutPopover = false,
  onLogoutPress,
}: BottomDockProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!dockVisible) return null;

  const bottom = bottomOffset + insets.bottom;

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
        <Pressable
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: pressed ? colors.borderSubtle : colors.background,
              borderColor: colors.borderSubtle,
            },
            Platform.OS === 'web' && { cursor: 'pointer' },
          ]}
          onPress={onOpenSearch}
          accessibilityLabel="Buscar"
          accessibilityRole="button"
        >
          <Search size={20} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>Buscar</Text>
        </Pressable>
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
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: PILL_HEIGHT,
    minWidth: 120,
    paddingHorizontal: Spacing.base,
    borderRadius: PILL_BORDER_RADIUS,
    borderWidth: 1,
  },
  pillLabel: {
    fontSize: 16,
  },
});
