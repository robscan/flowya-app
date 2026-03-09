/**
 * Mapeo de ids Maki (Mapbox) a componentes de icono Lucide para UI React Native.
 * Usado en ResultRow y otros listados donde place.maki está disponible.
 * Referencia: https://labs.mapbox.com/maki-icons/
 *
 * OL-URGENT-MAKI-001: iconos de categoría en listas y pins.
 */

import type { LucideIcon } from "lucide-react-native";
import {
  Landmark,
  MapPin,
  Mountain,
  TreePine,
  UtensilsCrossed,
  Coffee,
  Beer,
  BedDouble,
  Church,
  School,
  Building2,
  Plane,
  Ship,
  Train,
  Car,
  Factory,
  ShoppingBag,
  Wine,
} from "lucide-react-native";

/** Maki id (normalizado: sin sufijo -11/-15) -> LucideIcon. */
const MAKI_TO_LUCIDE: Record<string, LucideIcon> = {
  park: TreePine,
  museum: Landmark,
  monument: Landmark,
  attraction: Mountain,
  theatre: Building2,
  theater: Building2,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  bar: Beer,
  beer: Beer,
  lodging: BedDouble,
  place_of_worship: Church,
  school: School,
  hospital: Building2,
  airport: Plane,
  ferry: Ship,
  rail: Train,
  car: Car,
  industrial: Factory,
  shop: ShoppingBag,
  store: ShoppingBag,
  alcohol_shop: Wine,
};

/**
 * Resuelve un LucideIcon para un maki id dado.
 * Si no hay mapping, devuelve MapPin (genérico).
 */
export function getMakiLucideIcon(maki?: string | null): LucideIcon {
  if (!maki || typeof maki !== "string") return MapPin;
  const normalized = maki.trim().toLowerCase().replace(/-(11|15)$/i, "");
  return MAKI_TO_LUCIDE[normalized] ?? MapPin;
}
