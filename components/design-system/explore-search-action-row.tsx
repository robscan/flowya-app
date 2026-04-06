import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LogOut, User } from 'lucide-react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { IconButton } from './icon-button';
import { SearchLauncherField } from './search-launcher-field';

export type ExploreSearchActionRowProps = {
  onSearchPress: () => void;
  onProfilePress: () => void;
  searchPlaceholder?: string;
  accessibilityLabel?: string;
  isAuthUser?: boolean;
  showLogoutAction?: boolean;
  onLogoutPress?: () => void;
  profileAccessibilityLabel?: string;
  logoutPopoverBottomOffset?: number;
  /** Sin tope de ancho (p. ej. sheet de Explorar); por defecto la fila flotante limita a 520px. */
  fullWidth?: boolean;
};

export function ExploreSearchActionRow({
  onSearchPress,
  onProfilePress,
  searchPlaceholder,
  accessibilityLabel,
  isAuthUser = false,
  showLogoutAction = false,
  onLogoutPress,
  profileAccessibilityLabel = 'Cuenta',
  logoutPopoverBottomOffset = 52,
  fullWidth = false,
}: ExploreSearchActionRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = (colorScheme ?? 'light') === 'dark';
  const containerBackground = isDark ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.88)';
  const containerBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <View
      style={[
        styles.row,
        !fullWidth && styles.rowCappedWidth,
        {
          backgroundColor: containerBackground,
          borderColor: containerBorder,
        },
      ]}
    >
      <SearchLauncherField
        onPress={onSearchPress}
        placeholder={searchPlaceholder}
        accessibilityLabel={accessibilityLabel}
        variant="onMap"
      />
      <View style={styles.profileWrap}>
        {showLogoutAction && onLogoutPress ? (
          <View style={[styles.logoutPopover, { bottom: logoutPopoverBottomOffset }]}>
            <IconButton
              variant="default"
              onPress={onLogoutPress}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={22} color={colors.stateError} strokeWidth={2} />
            </IconButton>
          </View>
        ) : null}
        <IconButton
          variant="default"
          onPress={onProfilePress}
          accessibilityLabel={profileAccessibilityLabel}
        >
          <User
            size={24}
            color={isAuthUser ? colors.primary : colors.text}
            strokeWidth={2}
          />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.xs,
    width: '100%',
    padding: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    ...Shadow.subtle,
  },
  rowCappedWidth: {
    maxWidth: 520,
  },
  profileWrap: {
    position: 'relative',
  },
  logoutPopover: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
});
