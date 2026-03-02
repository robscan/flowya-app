export type TravelerLevel = {
  level: number;
  label: string;
  minCountries: number;
  maxCountries: number;
  minPoints: number;
  maxPoints: number;
};

export const TRAVELER_COUNTRY_POINTS = 120;
export const TRAVELER_SPOT_POINTS = 8;

export const TRAVELER_LEVELS: TravelerLevel[] = [
  { level: 1, label: "Inicio", minCountries: 0, maxCountries: 4, minPoints: 0, maxPoints: 299 },
  { level: 2, label: "En ruta", minCountries: 5, maxCountries: 9, minPoints: 300, maxPoints: 799 },
  { level: 3, label: "Con impulso", minCountries: 10, maxCountries: 19, minPoints: 800, maxPoints: 1999 },
  { level: 4, label: "En expansion", minCountries: 20, maxCountries: 34, minPoints: 2000, maxPoints: 3199 },
  { level: 5, label: "Buen ritmo", minCountries: 35, maxCountries: 49, minPoints: 3200, maxPoints: 4499 },
  { level: 6, label: "Sin fronteras", minCountries: 50, maxCountries: 69, minPoints: 4500, maxPoints: 5899 },
  { level: 7, label: "Avanzado", minCountries: 70, maxCountries: 89, minPoints: 5900, maxPoints: 7399 },
  { level: 8, label: "Alto vuelo", minCountries: 90, maxCountries: 109, minPoints: 7400, maxPoints: 8999 },
  { level: 9, label: "Referente", minCountries: 110, maxCountries: 129, minPoints: 9000, maxPoints: 10599 },
  { level: 10, label: "Elite", minCountries: 130, maxCountries: 149, minPoints: 10600, maxPoints: 12399 },
  { level: 11, label: "Legendario", minCountries: 150, maxCountries: 174, minPoints: 12400, maxPoints: 14599 },
  { level: 12, label: "Total", minCountries: 175, maxCountries: 195, minPoints: 14600, maxPoints: 999999 },
];

export function resolveTravelerLevel(countriesCount: number): TravelerLevel {
  const bounded = Math.max(0, Math.min(195, Math.floor(countriesCount)));
  return (
    TRAVELER_LEVELS.find((entry) => bounded >= entry.minCountries && bounded <= entry.maxCountries) ??
    TRAVELER_LEVELS[0]
  );
}

export function formatTravelerLevelRange(level: TravelerLevel): string {
  return `${level.minCountries}-${level.maxCountries} países`;
}

export function computeTravelerPoints(countriesCount: number, spotsCount: number): number {
  const countries = Math.max(0, Math.floor(countriesCount));
  const spots = Math.max(0, Math.floor(spotsCount));
  return countries * TRAVELER_COUNTRY_POINTS + spots * TRAVELER_SPOT_POINTS;
}

export function resolveTravelerLevelByPoints(points: number): TravelerLevel {
  const bounded = Math.max(0, Math.floor(points));
  return (
    TRAVELER_LEVELS.find((entry) => bounded >= entry.minPoints && bounded <= entry.maxPoints) ??
    TRAVELER_LEVELS[TRAVELER_LEVELS.length - 1]
  );
}

export function formatTravelerLevelPointsRange(level: TravelerLevel): string {
  if (level.level === TRAVELER_LEVELS[TRAVELER_LEVELS.length - 1].level) {
    return `${level.minPoints}+ pts`;
  }
  return `${level.minPoints}-${level.maxPoints} pts`;
}
