/**
 * MapCoreView — componente presentacional del núcleo del mapa (Explorar).
 * Renderiza Map + markers (spots + user). MapControls lo sigue renderizando el contenedor.
 *
 * Jerarquía de capas (orden de render = stacking): 1) spots no seleccionados,
 * 2) spot seleccionado (si existe), 3) ubicación del usuario (siempre encima).
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinLocation, MapPinSpot } from '@/components/design-system/map-pins';
import { LABEL_MIN_ZOOM } from '@/lib/map-core/constants';
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
  initialViewState: { longitude: number; latitude: number; zoom: number };
  onLoad: (e: import('react-map-gl/mapbox-legacy').MapEvent) => void;
  onPointerDown: (e: MapMouseEvent | MapTouchEvent) => void;
  onPointerMove: (e: MapMouseEvent | MapTouchEvent) => void;
  onPointerUp: () => void;
  spots: MapCoreSpot[];
  selectedSpotId: string | null;
  userCoords: { latitude: number; longitude: number } | null;
  zoom: number;
  onPinClick: (spot: MapCoreSpot) => void;
  /** Estilo del Map. */
  styleMap: object;
  /** Llamado al terminar movimiento/cámara (pan/zoom). Útil para draft placement. */
  onMoveEnd?: (e: ViewStateChangeEvent) => void;
  /** Tap/click en el mapa (lngLat del punto). Para draft placement: mover pin al punto tocado. */
  onClick?: (e: { lngLat: { lat: number; lng: number } }) => void;
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
        onClick={onClick}
      >
        {spots
          .filter((s) => s.id !== selectedSpotId)
          .map((spot) => (
            <Marker
              key={spot.id}
              latitude={spot.latitude}
              longitude={spot.longitude}
              anchor="center"
              onClick={() => onPinClick(spot)}
            >
              <MapPinSpot
                status={spot.pinStatus ?? 'default'}
                label={zoom >= LABEL_MIN_ZOOM ? spot.title : undefined}
                selected={false}
              />
            </Marker>
          ))}
        {spots
          .filter((s) => s.id === selectedSpotId)
          .map((spot) => (
            <Marker
              key={spot.id}
              latitude={spot.latitude}
              longitude={spot.longitude}
              anchor="center"
              onClick={() => onPinClick(spot)}
            >
              <MapPinSpot
                status={spot.pinStatus ?? 'default'}
                label={spot.title}
                selected
              />
            </Marker>
          ))}
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
