/**
 * Design System: map pins (canonical).
 * Unified pin visuals: user location (blue circle), spot dots (fill + outline).
 * Colors from theme; same shape for all spot states, color varies by status.
 * Reposo: tamaño base, sin icono. Activo (seleccionado): grande, con icono si to_visit/visited.
 * Status visual: puede derivarse de saved/visited (visited > to_visit > default).
 */

import { Pin } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const LOCATION_PIN_SIZE = 14;

/** Jerarquía canónica: Nivel 1 = protagonista (spot seleccionado). Nivel 2 = presencia (reposo, tamaño uniforme). Nivel 3 = mapa base. */
const SPOT_PIN_SIZE = 12; // Nivel 2 — reposo
const SPOT_PIN_SELECTED_SIZE = 24; // Nivel 1 — protagonista (spot seleccionado)
const SPOT_PIN_STROKE = 2;
const SPOT_PIN_SELECTED_STROKE = 2;
const SPOT_PIN_ICON_SIZE = 14;
const PIN_LABEL_FONT_SIZE = 11;
const PIN_LABEL_GAP = 2;
const PIN_LABEL_MAX_WIDTH = 80;
const EXISTING_PIN_LABEL_FONT_SIZE = 10;
const EXISTING_PIN_LABEL_GAP = 2;
const EXISTING_PIN_LABEL_MAX_WIDTH = 80;
const CREATING_PIN_LABEL_FONT_SIZE = 11;
const CREATING_PIN_LABEL_GAP = 2;
const CREATING_PIN_LABEL_MAX_WIDTH = 100;

/** Pin de ubicación del usuario: círculo azul clásico. No reutiliza MapPinSpot. */
export function MapPinLocation({
  colorScheme: colorSchemeOverride,
}: {
  colorScheme?: 'light' | 'dark';
} = {}) {
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const fill = colors.location?.primary ?? colors.pinUserLocation;
  return (
    <View
      style={[
        styles.locationPin,
        {
          width: LOCATION_PIN_SIZE,
          height: LOCATION_PIN_SIZE,
          borderRadius: LOCATION_PIN_SIZE / 2,
          backgroundColor: fill,
          opacity: 1,
        },
      ]}
    />
  );
}

export type SpotPinStatus = 'default' | 'to_visit' | 'visited';

function getSpotPinFillColor(colors: (typeof Colors)['light'], status: SpotPinStatus): string {
  const pin = colors.pin;
  if (!pin) {
    switch (status) {
      case 'to_visit':
        return colors.pinSpotToVisit;
      case 'visited':
        return colors.pinSpotVisited;
      default:
        return colors.pinSpotDefault;
    }
  }
  switch (status) {
    case 'to_visit':
      return pin.planned;
    case 'visited':
      return pin.visited;
    default:
      return pin.default;
  }
}

function getSpotPinOutlineColor(colors: (typeof Colors)['light']): string {
  return colors.pin?.outline ?? colors.pinSpotOutline;
}

/** Pin de spot: círculo sólido con borde + label opcional debajo. Pin y label se mueven juntos. */
/** Reposo (no seleccionado): tamaño base, sin icono. Activo (seleccionado): grande, con icono Pin si to_visit o visited. */
/** Hover y press son solo feedback visual; selected tiene siempre prioridad. */
export function MapPinSpot({
  status = 'default',
  label,
  selected = false,
  colorScheme: colorSchemeOverride,
}: {
  status?: SpotPinStatus;
  /** Nombre del spot; se muestra debajo del pin, centrado, caption. */
  label?: string | null;
  /** Si está seleccionado, el label puede tener mayor peso/opacidad. */
  selected?: boolean;
  colorScheme?: 'light' | 'dark';
} = {}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const fill = getSpotPinFillColor(colors, status);
  const outline = getSpotPinOutlineColor(colors);
  const labelColor = colors.text;
  const labelWeight = selected ? '600' : '500';

  const isSavedPin = status === 'to_visit' || status === 'visited';
  const isLargePin = selected;
  const pinSize = isLargePin ? SPOT_PIN_SELECTED_SIZE : SPOT_PIN_SIZE;
  const stroke = isLargePin ? SPOT_PIN_SELECTED_STROKE : SPOT_PIN_STROKE;
  const innerSize = pinSize - stroke * 2;

  const showHover = !selected && isHovered;
  const showPress = !selected && isPressed;

  return (
    <View
      style={[styles.spotPinWithLabel, { pointerEvents: 'box-none' }]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <View
        style={[
          styles.spotPinOuter,
          {
            width: pinSize,
            height: pinSize,
            borderRadius: pinSize / 2,
            borderWidth: stroke,
            borderColor: outline,
            opacity: 1,
          },
          showPress && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View
          style={[
            styles.spotPinInner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: fill,
              opacity: 1,
            },
          ]}
        >
          {selected && isSavedPin ? (
            <Pin
              size={SPOT_PIN_ICON_SIZE}
              color="#ffffff"
              strokeWidth={2}
              style={styles.spotPinIcon}
            />
          ) : null}
        </View>
      </View>
      {label ? (
        <Text
          style={[
            styles.spotPinLabel,
            {
              color: labelColor,
              opacity: 1,
              fontWeight: labelWeight,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** Scope G visual: pin "spot en creación" en Create Spot — primary, más grande, foco principal. */
const CREATING_PIN_SIZE = 20;
const CREATING_PIN_STROKE = 2;

/** Scope G visual: pin "spot existente" en Create Spot — secondary, tenue, informativo. */
const EXISTING_PIN_SIZE = 10;
const EXISTING_PIN_STROKE = 1;

export function MapPinCreating({
  label,
  colorScheme: colorSchemeOverride,
}: {
  /** Nombre del spot en creación; se muestra debajo del pin. */
  label?: string | null;
  colorScheme?: 'light' | 'dark';
} = {}) {
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const fill = colors.primary ?? colors.tint;
  const outline = colors.pin?.outline ?? colors.pinSpotOutline ?? '#fff';
  const inner = CREATING_PIN_SIZE - CREATING_PIN_STROKE * 2;
  return (
    <View
      style={[styles.creatingPinWithLabel, { pointerEvents: 'box-none' }]}
    >
      <View
        style={[
          styles.creatingPinOuter,
          {
            width: CREATING_PIN_SIZE,
            height: CREATING_PIN_SIZE,
            borderRadius: CREATING_PIN_SIZE / 2,
            borderWidth: CREATING_PIN_STROKE,
            borderColor: outline,
          },
        ]}
      >
        <View
          style={[
            styles.creatingPinInner,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              backgroundColor: fill,
            },
          ]}
        />
      </View>
      {label ? (
        <Text
          style={[
            styles.creatingPinLabel,
            {
              color: colors.text,
              fontWeight: '600',
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function MapPinExisting({
  label,
  colorScheme: colorSchemeOverride,
}: {
  /** Nombre del spot existente; se muestra debajo del pin. */
  label?: string | null;
  colorScheme?: 'light' | 'dark';
} = {}) {
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const fill = colors.secondary ?? colors.textSecondary;
  const outline = colors.border ?? colors.borderSubtle ?? 'rgba(0,0,0,0.1)';
  const inner = EXISTING_PIN_SIZE - EXISTING_PIN_STROKE * 2;
  return (
    <View
      style={[styles.existingPinWithLabel, { pointerEvents: 'box-none' }]}
    >
      <View
        style={[
          styles.existingPinOuter,
          {
            width: EXISTING_PIN_SIZE,
            height: EXISTING_PIN_SIZE,
            borderRadius: EXISTING_PIN_SIZE / 2,
            borderWidth: EXISTING_PIN_STROKE,
            borderColor: outline,
          },
        ]}
      >
        <View
          style={[
            styles.existingPinInner,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              backgroundColor: fill,
            },
          ]}
        />
      </View>
      {label ? (
        <Text
          style={[
            styles.existingPinLabel,
            {
              color: colors.text,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** Tamaños exportados para alinear Marker anchor si se necesita. */
export const MAP_PIN_SIZES = {
  location: LOCATION_PIN_SIZE,
  spot: SPOT_PIN_SIZE,
  spotSelected: SPOT_PIN_SELECTED_SIZE,
  creating: CREATING_PIN_SIZE,
  existing: EXISTING_PIN_SIZE,
} as const;

const styles = StyleSheet.create({
  locationPin: {},
  creatingPinWithLabel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  creatingPinOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatingPinInner: {},
  creatingPinLabel: {
    fontSize: CREATING_PIN_LABEL_FONT_SIZE,
    lineHeight: CREATING_PIN_LABEL_FONT_SIZE + 2,
    marginTop: CREATING_PIN_LABEL_GAP,
    maxWidth: CREATING_PIN_LABEL_MAX_WIDTH,
    textAlign: 'center',
  },
  existingPinWithLabel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  existingPinOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  existingPinInner: {},
  existingPinLabel: {
    fontSize: EXISTING_PIN_LABEL_FONT_SIZE,
    lineHeight: EXISTING_PIN_LABEL_FONT_SIZE + 2,
    marginTop: EXISTING_PIN_LABEL_GAP,
    maxWidth: EXISTING_PIN_LABEL_MAX_WIDTH,
    textAlign: 'center',
  },
  spotPinWithLabel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  spotPinOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotPinInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotPinIcon: {
    marginTop: -2,
  },
  spotPinLabel: {
    fontSize: PIN_LABEL_FONT_SIZE,
    lineHeight: PIN_LABEL_FONT_SIZE + 2,
    marginTop: PIN_LABEL_GAP,
    maxWidth: PIN_LABEL_MAX_WIDTH,
    textAlign: 'center',
  },
  showcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.base,
  },
  showcaseItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  showcaseLabel: {
    fontSize: 12,
  },
  modeBox: {
    padding: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.base,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
});

/** Showcase de pines para la pantalla Design System: light y dark. */
export function MapPinsShowcase() {
  const pinRow = (mode: 'light' | 'dark') => (
    <View
      key={mode}
      style={[
        styles.modeBox,
        {
          backgroundColor: mode === 'light' ? Colors.light.background : Colors.dark.background,
        },
      ]}
    >
      <Text
        style={[
          styles.modeTitle,
          { color: mode === 'light' ? Colors.light.text : Colors.dark.text },
        ]}
      >
        {mode === 'light' ? 'Light mode' : 'Dark mode'}
      </Text>
      <View style={styles.showcaseRow}>
        <View style={styles.showcaseItem}>
          <MapPinLocation colorScheme={mode} />
          <Text
            style={[
              styles.showcaseLabel,
              { color: mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary },
            ]}
          >
            Ubicación (sin label)
          </Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinSpot status="default" colorScheme={mode} label="Spot con nombre" />
          <Text
            style={[
              styles.showcaseLabel,
              { color: mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary },
            ]}
          >
            Spot + label
          </Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinSpot
            status="to_visit"
            colorScheme={mode}
            label="Por visitar"
          />
          <Text
            style={[
              styles.showcaseLabel,
              { color: mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary },
            ]}
          >
            Por visitar
          </Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinSpot status="visited" colorScheme={mode} label="Visitado" />
          <Text
            style={[
              styles.showcaseLabel,
              { color: mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary },
            ]}
          >
            Visitado
          </Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinSpot
            status="default"
            colorScheme={mode}
            label="Seleccionado"
            selected
          />
          <Text
            style={[
              styles.showcaseLabel,
              { color: mode === 'light' ? Colors.light.textSecondary : Colors.dark.textSecondary },
            ]}
          >
            Seleccionado
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      {pinRow('light')}
      {pinRow('dark')}
    </>
  );
}
