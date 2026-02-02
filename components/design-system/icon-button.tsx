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
import { Platform, Pressable, ViewStyle } from 'react-native';

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
  /** Web: dataSet para QA. */
  dataSet?: Record<string, string>;
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
    dataSet,
    testID,
  },
  ref
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);

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
            boxShadow:
              colorScheme === 'dark'
                ? '0 0 0 2px rgba(41,151,255,0.35)'
                : '0 0 0 2px rgba(0,113,227,0.35)',
          }),
        }
      : {};

  return (
    <Pressable
      ref={ref}
      dataSet={dataSet}
      testID={testID}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          ...Shadow.subtle,
          backgroundColor:
            disabled
              ? restingBackgroundColor
              : pressed || selected
                ? colors.primary
                : restingBackgroundColor,
          borderColor: (pressed || selected) && !disabled ? 'transparent' : restingBorderColor,
          opacity: disabled ? 0.5 : 1,
        } as ViewStyle,
        WebTouchManipulation,
        focusStyle,
      ]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {({ pressed }) => {
        const iconColor =
          (pressed || selected) && !disabled ? PRESSED_ICON_COLOR : undefined;
        return Children.map(children, (child) =>
          isValidElement(child) && iconColor != null
            ? cloneElement(child as React.ReactElement<{ color?: string }>, { color: iconColor })
            : child
        );
      }}
    </Pressable>
  );
});

