/**
 * Design System: IconButton (canonical).
 * Fuente de verdad visual: estilo del Hero de Spot Detail.
 * Todos los botones de icono del sistema usan este componente.
 *
 * Estados pressed/selected canónicos:
 * - Tap/click: feedback inmediato (bg primary, icon blanco).
 * - No usar opacity como feedback.
 */

import React, { Children, cloneElement, forwardRef, isValidElement, useState } from 'react';
import type { View } from 'react-native';
import { ActivityIndicator, Platform, Pressable, ViewStyle } from 'react-native';

import { Colors, Shadow, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SIZE_DEFAULT = 44;

/** Color del icono en estado pressed (contraste sobre primary). */
const PRESSED_ICON_COLOR = '#ffffff';

export type IconButtonVariant = 'default' | 'primary' | 'savePin';
export type SavePinState = 'default' | 'toVisit' | 'visited';

export type IconButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityRole?: 'button' | 'link';
  variant?: IconButtonVariant;
  /** Solo relevante si variant === 'savePin'. */
  savePinState?: SavePinState;
  /** Tamaño del botón (44 por defecto). */
  size?: number;
  /** Estado selected (persistente): mismo aspecto que pressed — bg primary, icono blanco. */
  selected?: boolean;
  /** Estado loading opcional para acciones async. */
  loading?: boolean;
  testID?: string;
};

export const IconButton = forwardRef<View, IconButtonProps>(function IconButton(
  {
    children,
    onPress,
    disabled = false,
    accessibilityLabel,
    accessibilityRole = 'button',
    variant = 'default',
    savePinState = 'default',
    size = SIZE_DEFAULT,
    selected = false,
    loading = false,
    testID,
  },
  ref
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const interactiveDisabled = disabled || loading;

  const restingBackgroundColor =
    variant === 'primary'
      ? colors.tint
      : variant === 'savePin'
        ? savePinState === 'toVisit'
          ? colors.stateToVisit
          : savePinState === 'visited'
            ? colors.stateSuccess
            : colors.text
        : colors.backgroundElevated;

  const restingBorderColor =
    variant === 'primary' || variant === 'savePin' ? 'transparent' : colors.borderSubtle;

  const focusStyle =
    Platform.OS === 'web'
      ? {
          outlineWidth: 0 as const,
          outlineStyle: 'none' as const,
          ...(focused && {
            boxShadow: `0 0 0 2px ${colors.stateFocusRing}`,
          }),
        }
      : {};

  return (
    <Pressable
      ref={ref}
      testID={testID}
      style={({ pressed }) => {
        const active = !interactiveDisabled && (pressed || selected || (Platform.OS === 'web' && hovered));
        return [
          {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          ...Shadow.subtle,
          backgroundColor: active ? colors.primary : restingBackgroundColor,
          borderColor: active ? 'transparent' : restingBorderColor,
          opacity: interactiveDisabled ? 0.5 : 1,
          transform: [{ scale: pressed && !interactiveDisabled ? 0.98 : 1 }],
        } as ViewStyle,
          WebTouchManipulation,
          focusStyle,
        ];
      }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={interactiveDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: interactiveDisabled, busy: loading, selected }}
    >
      {({ pressed }) => {
        const active = !interactiveDisabled && (pressed || selected || (Platform.OS === 'web' && hovered));
        const iconColor =
          active ? PRESSED_ICON_COLOR : undefined;
        if (loading) {
          return (
            <ActivityIndicator
              size="small"
              color={active ? PRESSED_ICON_COLOR : colors.textSecondary}
            />
          );
        }
        return Children.map(children, (child) =>
          isValidElement(child) && iconColor != null
            ? cloneElement(child as React.ReactElement<{ color?: string }>, { color: iconColor })
            : child
        );
      }}
    </Pressable>
  );
});
