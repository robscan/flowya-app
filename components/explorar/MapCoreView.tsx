/**
 * MapCoreView — componente presentacional del núcleo del mapa (Explorar).
 * Renderiza Map + markers (user + preview pin). Los spots se dibujan como SymbolLayer
 * nativa en useMapCore (debajo de POI).
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinLocation, MapPinSpot } from '@/components/design-system/map-pins';
import type {
  MapMouseEvent,
  MapTouchEvent,
  ViewStateChangeEvent,
} from 'react-map-gl/mapbox-legacy';
import { Map, Marker } from 'react-map-gl/mapbox-legacy';

export type MapCoreSpot = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  pinStatus?: SpotPinStatus;
};

export type MapCoreViewProps = {
  mapboxAccessToken: string;
  mapStyle: string;
  initialViewState: { longitude: number; latitude: number; zoom: number; pitch?: number; bearing?: number };
  onLoad: (e: import('react-map-gl/mapbox-legacy').MapEvent) => void;
  onPointerDown: (e: MapMouseEvent | MapTouchEvent) => void;
  onPointerMove: (e: MapMouseEvent | MapTouchEvent) => void;
  onPointerUp: () => void;
  /** Spots (para compatibilidad; se renderizan en useMapCore como SymbolLayer). */
  spots: MapCoreSpot[];
  selectedSpotId: string | null;
  userCoords: { latitude: number; longitude: number } | null;
  zoom: number;
  /** Para compatibilidad; el click se maneja en useMapCore. */
  onPinClick: (spot: MapCoreSpot) => void;
  /** Estilo del Map. */
  styleMap: object;
  /** Llamado al terminar movimiento/cámara (pan/zoom). Útil para draft placement. */
  onMoveEnd?: (e: ViewStateChangeEvent) => void;
  /** Tap/click en el mapa. Incluye lngLat y point (píxeles) para queryRenderedFeatures. */
  onClick?: (e: { lngLat: { lat: number; lng: number }; point?: { x: number; y: number } }) => void;
  /** Pin de preview (ej. Paso 0 create spot): muestra posición donde se creará el spot. No interactivo. */
  previewPinCoords?: { lat: number; lng: number } | null;
  /** Label del pin de preview (ej. nombre que el usuario escribe). */
  previewPinLabel?: string | null;
};

export function MapCoreView({
  mapboxAccessToken,
  mapStyle,
  initialViewState,
  onLoad,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  spots,
  selectedSpotId,
  userCoords,
  zoom,
  onPinClick,
  styleMap,
  onMoveEnd,
  onClick,
  previewPinCoords = null,
  previewPinLabel = null,
}: MapCoreViewProps) {
  return (
    <Map
        key={mapStyle}
        mapboxAccessToken={mapboxAccessToken}
        mapStyle={mapStyle}
        projection="globe"
        initialViewState={initialViewState}
        style={styleMap}
        onLoad={onLoad}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onMoveEnd={onMoveEnd}
        onClick={onClick != null ? (e) => onClick({ lngLat: e.lngLat, point: e.point }) : undefined}
      >
        {/* Spots: renderizados como SymbolLayer nativa en useMapCore (debajo de POI). */}
        {userCoords ? (
          <Marker
            latitude={userCoords.latitude}
            longitude={userCoords.longitude}
            anchor="center"
          >
            <MapPinLocation />
          </Marker>
        ) : null}
        {previewPinCoords ? (
          <Marker
            latitude={previewPinCoords.lat}
            longitude={previewPinCoords.lng}
            anchor="center"
          >
            <MapPinSpot
              status="default"
              selected
              label={previewPinLabel?.trim() || undefined}
            />
          </Marker>
        ) : null}
    </Map>
  );
}
