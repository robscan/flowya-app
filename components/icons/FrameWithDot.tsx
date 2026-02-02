/**
 * Icono custom: marco con punto central.
 * Comunica "reencuadrar / ajustar vista" sin confusión con zoom, pantalla completa ni ubicación.
 * Usado en controles del mapa (Ver todo).
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type FrameWithDotProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 2;
const VIEWBOX = 24;
const PAD = 3;
const CORNER = 6;
const CENTER_R = 2;

export function FrameWithDot({
  size = DEFAULT_SIZE,
  color = 'currentColor',
  strokeWidth = DEFAULT_STROKE,
}: FrameWithDotProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 4 esquinas tipo marco (como focus/scan) */}
      <Path d={`M${PAD} ${PAD + CORNER}V${PAD}h${CORNER}`} />
      <Path d={`M${VIEWBOX - PAD - CORNER} ${PAD}h${CORNER}v${CORNER}`} />
      <Path d={`M${VIEWBOX - PAD} ${VIEWBOX - PAD - CORNER}v${CORNER}h-${CORNER}`} />
      <Path d={`M${PAD + CORNER} ${VIEWBOX - PAD}h-${CORNER}v-${CORNER}`} />
      {/* Punto sólido centrado */}
      <Circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={CENTER_R} fill={color} />
    </Svg>
  );
}
