/**
 * MapCoreView — componente presentacional del núcleo del mapa (Explorar).
 * Renderiza Map + markers (spots + user). MapControls lo sigue renderizando el contenedor.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinLocation, MapPinSpot } from '@/components/design-system/map-pins';
import { LABEL_MIN_ZOOM } from '@/lib/map-core/constants';
import type { MapMouseEvent, MapTouchEvent } from 'react-map-gl/mapbox-legacy';
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
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            anchor="center"
            onClick={() => onPinClick(spot)}
          >
            <MapPinSpot
              status={spot.pinStatus ?? 'default'}
              label={
                zoom >= LABEL_MIN_ZOOM || selectedSpotId === spot.id ? spot.title : undefined
              }
              selected={selectedSpotId === spot.id}
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
    </Map>
  );
}
