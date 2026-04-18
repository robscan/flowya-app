/**
 * Design System: map pins (canonical).
 * Default (mapa): tokens `Colors.*.mapPinSpot.default` + radios `unselected`/`selected` — misma fuente que
 * `lib/map-core/spots-layer.ts` (círculos + capas DEFAULT_PLUS_* + labels). Ver bitácoras 268–271.
 * `plain` = solo círculo; `flowya_unlinked` = círculo + «+». Por visitar/visitado: `getCompositePinMetrics`.
 */

import { Check, Pin } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MAPBOX_LABEL_STYLE_DARK, MAPBOX_LABEL_STYLE_LIGHT } from '@/lib/map-core/constants';
import {
  getCompositePinMetrics,
  getSpotCircleMetrics,
  getUserLocationPinSize,
} from '@/lib/map-core/map-pin-metrics';

const PIN_SELECT_DURATION_MS = 200;
const PIN_HOVER_PRESS_DURATION_MS = 100;
const PIN_EASING = Easing.out(Easing.cubic);

const PIN_LABEL_FONT_SIZE = 12;
const PIN_LABEL_GAP = 7;
const PIN_LABEL_MAX_WIDTH = 90;
const EXISTING_PIN_LABEL_FONT_SIZE = 10;
const EXISTING_PIN_LABEL_GAP = 3;
const EXISTING_PIN_LABEL_MAX_WIDTH = 90;
const CREATING_PIN_LABEL_FONT_SIZE = 11;
const CREATING_PIN_LABEL_GAP = 3;
const CREATING_PIN_LABEL_MAX_WIDTH = 100;

function makeTextShadowStyle(color: string, radius: number, offsetX = 0, offsetY = 0) {
  return { textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}` } as const;
}

type ThemeColors = (typeof Colors)['light'];

/** Pin de ubicación del usuario: círculo azul; tamaño desde `getUserLocationPinSize` (factor sobre radio en reposo). */
export function MapPinLocation({
  colorScheme: colorSchemeOverride,
}: {
  colorScheme?: 'light' | 'dark';
} = {}) {
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const fill = colors.location?.primary ?? colors.pinUserLocation;
  const size = getUserLocationPinSize(colors.mapPinSpot);
  return (
    <View
      style={[
        styles.locationPin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
          opacity: 1,
        },
      ]}
    />
  );
}

export type SpotPinStatus = 'default' | 'to_visit' | 'visited';

/**
 * Solo aplica con `status === 'default'`.
 * - `plain`: solo círculo (p. ej. vista catálogo / foco en color).
 * - `flowya_unlinked`: pin nativo sin POI — círculo + «+» como capas `DEFAULT_PLUS_*` en Mapbox.
 */
export type MapPinDefaultStyle = 'plain' | 'flowya_unlinked';

/** Relleno spot en mapa: `to_visit`/`visited` = `pin.*`; `default` = `mapPinSpot.default.fill` (capas circle Mapbox). */
function getSpotPinFillColor(colors: (typeof Colors)['light'], status: SpotPinStatus): string {
  if (status === 'default') {
    return colors.mapPinSpot.default.fill;
  }
  const pin = colors.pin;
  if (!pin) {
    return status === 'to_visit' ? colors.pinSpotToVisit : colors.pinSpotVisited;
  }
  return status === 'to_visit' ? pin.planned : pin.visited;
}

function getSavedPinHaloColor(colors: ThemeColors, status: 'to_visit' | 'visited'): string {
  return status === 'to_visit' ? colors.mapPinSpot.toVisit.stroke : colors.mapPinSpot.visited.stroke;
}

/** Pin de spot: círculo sólido con borde + label opcional debajo. Pin y label se mueven juntos. */
/** Por visitar / visitado: icono Pin o Check siempre visible (como bitmap Mapbox), reposo y seleccionado. */
/** Hover y press: feedback; selected anima tamaño. */
export function MapPinSpot({
  status = 'default',
  label,
  selected = false,
  colorScheme: colorSchemeOverride,
  defaultPinStyle = 'plain',
}: {
  status?: SpotPinStatus;
  /** Nombre del spot; se muestra debajo del pin, centrado, caption. */
  label?: string | null;
  /** Si está seleccionado, el label puede tener mayor peso/opacidad. */
  selected?: boolean;
  colorScheme?: 'light' | 'dark';
  /** Solo `status === 'default'`. `flowya_unlinked` = círculo + «+» (spot sin POI en mapa). */
  defaultPinStyle?: MapPinDefaultStyle;
} = {}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const systemScheme = useColorScheme();
  const colorScheme = colorSchemeOverride ?? systemScheme ?? 'light';
  const colors = Colors[colorScheme];
  const mp = colors.mapPinSpot;
  const isComposite = status === 'to_visit' || status === 'visited';
  const circleRest = useMemo(() => getSpotCircleMetrics(mp, false), [mp]);
  const circleSel = useMemo(() => getSpotCircleMetrics(mp, true), [mp]);
  const compositeRest = useMemo(() => getCompositePinMetrics(mp, false), [mp]);
  const compositeSel = useMemo(() => getCompositePinMetrics(mp, true), [mp]);
  const fill = getSpotPinFillColor(colors, status);
  const haloColor = isComposite ? getSavedPinHaloColor(colors, status) : undefined;
  const mapboxLabelStyle =
    colorScheme === 'dark' ? MAPBOX_LABEL_STYLE_DARK : MAPBOX_LABEL_STYLE_LIGHT;
  const labelColor = mapboxLabelStyle.textColor;
  const labelWeight = '600';
  const labelFontSize = PIN_LABEL_FONT_SIZE;

  const hasStatusIcon = status === 'to_visit' || status === 'visited';
  const savedLabelShadowStyle = hasStatusIcon
    ? makeTextShadowStyle(
        colorScheme === 'dark' ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.55)',
        1.25,
      )
    : null;

  const selectedProgress = useSharedValue(selected ? 1 : 0);
  const hoverProgress = useSharedValue(0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, {
      duration: PIN_SELECT_DURATION_MS,
      easing: PIN_EASING,
    });
  }, [selected, selectedProgress]);

  useEffect(() => {
    const active = !selected && isHovered;
    hoverProgress.value = withTiming(active ? 1 : 0, {
      duration: PIN_HOVER_PRESS_DURATION_MS,
      easing: PIN_EASING,
    });
  }, [selected, isHovered, hoverProgress]);

  useEffect(() => {
    const active = !selected && isPressed;
    pressProgress.value = withTiming(active ? 1 : 0, {
      duration: PIN_HOVER_PRESS_DURATION_MS,
      easing: PIN_EASING,
    });
  }, [selected, isPressed, pressProgress]);

  const circlePinAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const w = circleRest.diameter + (circleSel.diameter - circleRest.diameter) * p;
    const s = circleRest.strokeWidth + (circleSel.strokeWidth - circleRest.strokeWidth) * p;
    const hoverScale = 1 + 0.08 * hoverProgress.value;
    const pressScale = 1 - 0.05 * pressProgress.value;
    const interactScale = pressProgress.value > 0 ? pressScale : hoverScale;
    return {
      width: w,
      height: w,
      borderRadius: w / 2,
      borderWidth: s,
      transform: [{ scale: interactScale }],
    };
  }, [circleRest.diameter, circleRest.strokeWidth, circleSel.diameter, circleSel.strokeWidth]);

  const circleInnerAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const w = circleRest.diameter + (circleSel.diameter - circleRest.diameter) * p;
    const s = circleRest.strokeWidth + (circleSel.strokeWidth - circleRest.strokeWidth) * p;
    const inner = w - s * 2;
    return {
      width: inner,
      height: inner,
      borderRadius: inner / 2,
    };
  }, [circleRest.diameter, circleRest.strokeWidth, circleSel.diameter, circleSel.strokeWidth]);

  const compositeOuterAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const outer =
      compositeRest.outerSpriteSize + (compositeSel.outerSpriteSize - compositeRest.outerSpriteSize) * p;
    const hoverScale = 1 + 0.08 * hoverProgress.value;
    const pressScale = 1 - 0.05 * pressProgress.value;
    const interactScale = pressProgress.value > 0 ? pressScale : hoverScale;
    return {
      width: outer,
      height: outer,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale: interactScale }],
    };
  }, [compositeRest.outerSpriteSize, compositeSel.outerSpriteSize]);

  const compositeDiscAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const disc =
      compositeRest.discOuterDiameter + (compositeSel.discOuterDiameter - compositeRest.discOuterDiameter) * p;
    const halo =
      compositeRest.haloStrokeWidth + (compositeSel.haloStrokeWidth - compositeRest.haloStrokeWidth) * p;
    return {
      width: disc,
      height: disc,
      borderRadius: disc / 2,
      borderWidth: halo,
    };
  }, [compositeRest.discOuterDiameter, compositeRest.haloStrokeWidth, compositeSel.discOuterDiameter, compositeSel.haloStrokeWidth]);

  const compositeIconScaleStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const sz = compositeRest.iconSize + (compositeSel.iconSize - compositeRest.iconSize) * p;
    return {
      transform: [{ scale: sz / compositeSel.iconSize }],
    };
  }, [compositeRest.iconSize, compositeSel.iconSize]);

  const showFlowyaPlus = status === 'default' && defaultPinStyle === 'flowya_unlinked';

  const plusTextAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    const fs = mp.unselected.plusTextSize + (mp.selected.plusTextSize - mp.unselected.plusTextSize) * p;
    return {
      fontSize: fs,
      lineHeight: fs + 2,
    };
  }, [mp.unselected.plusTextSize, mp.selected.plusTextSize]);

  /** Alineado con `circle-stroke-color`: `mapPinSpot.default.stroke` → `selected.defaultStroke`. */
  const circleStrokeAnimatedStyle = useAnimatedStyle(() => {
    const p = selectedProgress.value;
    return {
      borderColor: interpolateColor(p, [0, 1], [mp.default.stroke, mp.selected.defaultStroke]),
    };
  }, [mp.default.stroke, mp.selected.defaultStroke]);

  return (
    <View
      style={[styles.spotPinWithLabel, { pointerEvents: 'box-none' }]}
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => {
              setIsHovered(false);
              setIsPressed(false);
            },
            onMouseDown: () => setIsPressed(true),
            onMouseUp: () => setIsPressed(false),
          } as Record<string, unknown>)
        : {})}
    >
      {isComposite ? (
        <Animated.View style={[styles.spotPinOuter, compositeOuterAnimatedStyle]}>
          <Animated.View
            style={[
              styles.spotPinInner,
              compositeDiscAnimatedStyle,
              { borderColor: haloColor, backgroundColor: fill },
            ]}
          >
            {hasStatusIcon && selected ? (
              <Animated.View style={[styles.spotPinIconWrap, compositeIconScaleStyle]}>
                {status === 'visited' ? (
                  <Check
                    size={compositeSel.iconSize}
                    color="#ffffff"
                    strokeWidth={compositeSel.checkIconStrokeWidth}
                    style={styles.spotPinIcon}
                  />
                ) : (
                  <Pin
                    size={compositeSel.iconSize}
                    color="#ffffff"
                    strokeWidth={compositeSel.pinIconStrokeWidth}
                    style={styles.spotPinIcon}
                  />
                )}
              </Animated.View>
            ) : null}
          </Animated.View>
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.spotPinOuter, circlePinAnimatedStyle, circleStrokeAnimatedStyle]}
        >
          <Animated.View
            style={[
              styles.spotPinInner,
              { backgroundColor: mp.default.fill },
              circleInnerAnimatedStyle,
            ]}
          >
            {showFlowyaPlus ? (
              <Animated.Text
                style={[
                  styles.spotPinPlusGlyph,
                  plusTextAnimatedStyle,
                  {
                    color: mp.default.plusText,
                    fontFamily: Fonts.sans,
                    textShadowColor: mp.default.plusHalo,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: mp.default.plusHaloWidth * 4,
                  },
                ]}
              >
                +
              </Animated.Text>
            ) : null}
          </Animated.View>
        </Animated.View>
      )}
      {label ? (
        <Text
          style={[
            styles.spotPinLabel,
            status === 'default'
              ? {
                  color: mp.default.labelText,
                  fontWeight: labelWeight,
                  fontFamily: Fonts.sans,
                  fontSize: labelFontSize,
                  lineHeight: labelFontSize + 2,
                  ...makeTextShadowStyle(mp.default.labelHalo, mp.default.labelHaloWidth * 2),
                }
              : {
                  color: labelColor,
                  opacity: 1,
                  fontWeight: labelWeight,
                  fontFamily: Fonts.sans,
                  fontSize: labelFontSize,
                  lineHeight: labelFontSize + 2,
                  ...(savedLabelShadowStyle ?? {}),
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
  const mp = colors.mapPinSpot;
  const creatingSize = mp.selected.radius * 2 - 4;
  const creatingStroke = Math.min(2, mp.selected.strokeWidth);
  const fill = colors.primary ?? colors.tint;
  const outline = colors.pin?.outline ?? colors.pinSpotOutline ?? '#fff';
  const inner = creatingSize - creatingStroke * 2;
  return (
    <View
      style={[styles.creatingPinWithLabel, { pointerEvents: 'box-none' }]}
    >
      <View
        style={[
          styles.creatingPinOuter,
          {
            width: creatingSize,
            height: creatingSize,
            borderRadius: creatingSize / 2,
            borderWidth: creatingStroke,
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
              fontFamily: Fonts.sans,
              ...makeTextShadowStyle(
                colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                2,
              ),
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
  const mp = colors.mapPinSpot;
  const existingSize = Math.round(mp.unselected.radius * 1.25);
  const existingStroke = mp.unselected.strokeWidth;
  const fill = colors.secondary ?? colors.textSecondary;
  const outline = colors.border ?? colors.borderSubtle ?? 'rgba(0,0,0,0.1)';
  const inner = existingSize - existingStroke * 2;
  return (
    <View
      style={[styles.existingPinWithLabel, { pointerEvents: 'box-none' }]}
    >
      <View
        style={[
          styles.existingPinOuter,
          {
            width: existingSize,
            height: existingSize,
            borderRadius: existingSize / 2,
            borderWidth: existingStroke,
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
              fontFamily: Fonts.sans,
              ...makeTextShadowStyle(
                colorScheme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                2,
              ),
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

/** Tamaños de referencia (light): círculos default vs sprite guardados + ubicación / create. */
const _lightMp = Colors.light.mapPinSpot;
const _cRest = getCompositePinMetrics(_lightMp, false);
const _cSel = getCompositePinMetrics(_lightMp, true);
export const MAP_PIN_SIZES = {
  location: getUserLocationPinSize(_lightMp),
  spot: _lightMp.unselected.radius * 2,
  spotSelected: _lightMp.selected.radius * 2,
  spotSavedRestOuter: _cRest.outerSpriteSize,
  spotSavedSelectedOuter: _cSel.outerSpriteSize,
  spotSavedRestDisc: _cRest.discOuterDiameter,
  spotSavedSelectedDisc: _cSel.discOuterDiameter,
  creating: _lightMp.selected.radius * 2 - 4,
  existing: Math.round(_lightMp.unselected.radius * 1.25),
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
    overflow: 'visible',
  },
  spotPinPlusGlyph: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  spotPinIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotPinIcon: {
    marginTop: -2,
  },
  spotPinLabel: {
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
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  modeBox: {
    padding: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.base,
  },
  modeTitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  subsectionTitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  subsectionTitleFirst: {
    marginTop: 0,
  },
  showcaseRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: Spacing.lg,
    marginBottom: Spacing.base,
  },
});

/** Matriz canónica: reposo / seleccionado × estado. Default en mapa = pin Flowya sin POI (`flowya_unlinked`). */
const SPOT_PIN_MATRIX: {
  status: SpotPinStatus;
  selected: boolean;
  caption: string;
  defaultPinStyle?: MapPinDefaultStyle;
}[] = [
  {
    status: 'default',
    selected: false,
    caption: 'Default (Flowya sin POI) · reposo',
    defaultPinStyle: 'flowya_unlinked',
  },
  {
    status: 'default',
    selected: true,
    caption: 'Default (Flowya sin POI) · seleccionado',
    defaultPinStyle: 'flowya_unlinked',
  },
  { status: 'to_visit', selected: false, caption: 'Por visitar · reposo' },
  { status: 'to_visit', selected: true, caption: 'Por visitar · seleccionado' },
  { status: 'visited', selected: false, caption: 'Visitado · reposo' },
  { status: 'visited', selected: true, caption: 'Visitado · seleccionado' },
];

/** Showcase: solo mapa claro (Explore); tamaños = `theme.mapPinSpot` + proporciones documentadas. */
export function MapPinsShowcase() {
  const fg = Colors.light.text;
  const meta = Colors.light.textSecondary;
  const mode = 'light' as const;

  return (
    <View style={[styles.modeBox, { backgroundColor: Colors.light.background }]}>
      <Text style={[styles.modeTitle, { color: fg }]}>Mapa claro (Explore)</Text>
      <Text style={[styles.showcaseLabel, { color: meta, marginBottom: Spacing.md, maxWidth: 540, lineHeight: 18 }]}>
        Default Flowya sin POI: relleno/borde/label/plus desde `Colors.light.mapPinSpot.default` (misma pintura que
        `spots-layer`: circle + DEFAULT_PLUS_* + labels; bitácoras 268–271). `flowya_unlinked` muestra el «+».
        Por visitar / visitado: `getCompositePinMetrics` + `pin-status-images`.
      </Text>

      <Text style={[styles.subsectionTitle, styles.subsectionTitleFirst, { color: fg }]}>Ubicación</Text>
      <View style={styles.showcaseRowWrap}>
        <View style={styles.showcaseItem}>
          <MapPinLocation colorScheme={mode} />
          <Text style={[styles.showcaseLabel, { color: meta }]}>Usuario (sin label)</Text>
        </View>
      </View>

      <Text style={[styles.subsectionTitle, { color: fg }]}>Default — solo círculo (`plain`)</Text>
      <Text style={[styles.showcaseLabel, { color: meta, marginBottom: Spacing.sm, maxWidth: 440 }]}>
        Sin «+» central; útil para vistas mínimas o cuando el foco es solo el color del pin. En mapa, el pin nativo sin
        POI usa `flowya_unlinked`.
      </Text>
      <View style={styles.showcaseRowWrap}>
        <View style={styles.showcaseItem}>
          <MapPinSpot
            status="default"
            colorScheme={mode}
            label={null}
            selected={false}
            defaultPinStyle="plain"
          />
          <Text style={[styles.showcaseLabel, { color: meta }]}>Plain · sin label</Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinSpot
            status="default"
            colorScheme={mode}
            label="Lugar"
            selected={false}
            defaultPinStyle="plain"
          />
          <Text style={[styles.showcaseLabel, { color: meta }]}>Plain · con nombre</Text>
        </View>
      </View>

      <Text style={[styles.subsectionTitle, { color: fg }]}>Spot — todos los estados (reposo / seleccionado)</Text>
      <View style={styles.showcaseRowWrap}>
        {SPOT_PIN_MATRIX.map((cell) => (
          <View key={`${cell.status}-${cell.selected ? 's' : 'r'}`} style={styles.showcaseItem}>
            <MapPinSpot
              status={cell.status}
              colorScheme={mode}
              label="Nombre"
              selected={cell.selected}
              defaultPinStyle={cell.defaultPinStyle}
            />
            <Text style={[styles.showcaseLabel, { color: meta }]}>{cell.caption}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.subsectionTitle, { color: fg }]}>Create spot</Text>
      <View style={styles.showcaseRowWrap}>
        <View style={styles.showcaseItem}>
          <MapPinCreating colorScheme={mode} label="Nuevo lugar" />
          <Text style={[styles.showcaseLabel, { color: meta }]}>Creando (foco)</Text>
        </View>
        <View style={styles.showcaseItem}>
          <MapPinExisting colorScheme={mode} label="Ya existe" />
          <Text style={[styles.showcaseLabel, { color: meta }]}>Existente (referencia)</Text>
        </View>
      </View>
    </View>
  );
}
