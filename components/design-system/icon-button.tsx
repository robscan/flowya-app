/**
 * Design System: IconButton (canonical).
 * Fuente de verdad visual: estilo del Hero de Spot Detail.
 * Todos los botones de icono del sistema usan este componente.
 */

import React, { forwardRef, useState } from 'react';
import type { View } from 'react-native';
import { Platform, Pressable, ViewStyle } from 'react-native';

import { Colors, Shadow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SIZE = 44;
const BORDER_RADIUS = SIZE / 2;

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
    dataSet,
    testID,
  },
  ref
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [focused, setFocused] = useState(false);

  const backgroundColor =
    variant === 'primary'
      ? colors.tint
      : variant === 'savePin'
        ? savePinState === 'toVisit'
          ? colors.stateToVisit
          : savePinState === 'visited'
            ? colors.stateSuccess
            : colors.backgroundElevated
        : colors.backgroundElevated;

  const borderColor =
    variant === 'primary' || variant === 'savePin'
      ? savePinState !== 'default'
        ? 'transparent'
        : colors.borderSubtle
      : colors.borderSubtle;

  const baseStyle: ViewStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    borderWidth: 1,
    borderColor,
    ...Shadow.subtle,
  };

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
        baseStyle,
        focusStyle,
        {
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </Pressable>
  );
});

