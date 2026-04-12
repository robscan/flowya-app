/**
 * Contrato de tap en hero de spot (portada / galería) — OL-CONTENT-002.
 * Permite lightbox con desplazamiento entre todas las URLs mostradas.
 */

export type SpotHeroImagePressPayload = {
  uri: string;
  allUris: string[];
  index: number;
};

export type SpotHeroImagePressHandler = (payload: SpotHeroImagePressPayload) => void;
