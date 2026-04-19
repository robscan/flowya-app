import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeVisitedCountryKpisFromSpots } from "@/lib/explore/visited-country-kpis";
import { fetchVisibleSpotsWithPinsDeduped } from "@/lib/explore/fetch-visible-spots-with-pins";
import {
  clearProfileKpiWarmSnapshot,
  commitProfileKpiWarmSnapshotFromExploreSpots,
  readProfileKpiWarmSnapshot,
} from "@/lib/explore/profile-kpi-warm-cache";
import { resolveTravelerLevelByPoints } from "@/lib/traveler-levels";
import { supabase } from "@/lib/supabase";

export type ProfileKpis = {
  loading: boolean;
  /**
   * Lugares visitados: cardinal de spots con pin visitado (mismo criterio que `exploreMapKpiPlacesCount`
   * con filtro Por visitar/Visitados y sin recortes por etiqueta/país en listado).
   */
  visitedPlacesCount: number;
  visitedCountriesCount: number | null;
  visitedSpotsTotal: number;
  visitedWorldPercent: number;
  flowsPoints: number;
  travelerLevelLabel: string;
  currentTravelerLevel: ReturnType<typeof resolveTravelerLevelByPoints>;
  /**
   * Vuelve a cargar desde Supabase (deduplicado con `refetchSpots` del mapa cuando aplica).
   * `silent: true` evita el spinner si ya hubo una carga con sesión (p. ej. al volver a Perfil desde otra ruta).
   */
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
};

function applyWarmToState(
  setters: {
    setVisitedPlacesCount: (n: number) => void;
    setVisitedCountriesCount: (n: number | null) => void;
    setVisitedSpotsTotal: (n: number) => void;
    setFlowsPoints: (n: number) => void;
    setVisitedWorldPercent: (n: number) => void;
    setCurrentTravelerLevel: (v: ReturnType<typeof resolveTravelerLevelByPoints>) => void;
  },
  warm: NonNullable<ReturnType<typeof readProfileKpiWarmSnapshot>>,
) {
  setters.setVisitedCountriesCount(warm.visitedCountriesCount);
  setters.setVisitedPlacesCount(warm.visitedPlacesCount);
  setters.setVisitedSpotsTotal(warm.visitedSpotsTotal);
  setters.setFlowsPoints(warm.flowsPoints);
  setters.setVisitedWorldPercent(warm.visitedWorldPercent);
  setters.setCurrentTravelerLevel(warm.currentTravelerLevel);
}

export function useProfileKpis(): ProfileKpis {
  const [loading, setLoading] = useState(true);
  const [visitedPlacesCount, setVisitedPlacesCount] = useState(0);
  const [visitedCountriesCount, setVisitedCountriesCount] = useState<number | null>(0);
  const [visitedSpotsTotal, setVisitedSpotsTotal] = useState(0);
  const [flowsPoints, setFlowsPoints] = useState(0);
  const [visitedWorldPercent, setVisitedWorldPercent] = useState(0);
  const [currentTravelerLevel, setCurrentTravelerLevel] = useState(() =>
    resolveTravelerLevelByPoints(0),
  );

  /** Tras al menos una carga completa con usuario autenticado, los refetch silenciosos omiten el spinner. */
  const hasLoadedUserKpisRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent && hasLoadedUserKpisRef.current);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user || user.is_anonymous) {
      hasLoadedUserKpisRef.current = false;
      clearProfileKpiWarmSnapshot();
      setVisitedPlacesCount(0);
      setVisitedCountriesCount(0);
      setVisitedSpotsTotal(0);
      setFlowsPoints(0);
      setVisitedWorldPercent(0);
      setCurrentTravelerLevel(resolveTravelerLevelByPoints(0));
      setLoading(false);
      return;
    }

    const warm = readProfileKpiWarmSnapshot(user.id);
    if (warm && !silent) {
      applyWarmToState(
        {
          setVisitedPlacesCount,
          setVisitedCountriesCount,
          setVisitedSpotsTotal,
          setFlowsPoints,
          setVisitedWorldPercent,
          setCurrentTravelerLevel,
        },
        warm,
      );
      setLoading(false);
    } else if (!silent) {
      setLoading(true);
    }

    try {
      const visible = await fetchVisibleSpotsWithPinsDeduped(user.id);
      const k = computeVisitedCountryKpisFromSpots(visible);
      setVisitedCountriesCount(k.visitedCountriesCount);
      setVisitedPlacesCount(k.visitedPlacesCount);
      setVisitedSpotsTotal(k.visitedSpotsTotal);
      setFlowsPoints(k.flowsPoints);
      setVisitedWorldPercent(k.visitedWorldPercent);
      setCurrentTravelerLevel(k.currentTravelerLevel);
      commitProfileKpiWarmSnapshotFromExploreSpots(user.id, visible);
      hasLoadedUserKpisRef.current = true;
    } catch {
      setVisitedCountriesCount(null);
      setVisitedPlacesCount(0);
      setVisitedSpotsTotal(0);
      setFlowsPoints(0);
      setVisitedWorldPercent(0);
      setCurrentTravelerLevel(resolveTravelerLevelByPoints(0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const travelerLevelLabel = useMemo(() => {
    return `${currentTravelerLevel.level}/12`;
  }, [currentTravelerLevel.level]);

  return {
    loading,
    visitedPlacesCount,
    visitedCountriesCount,
    visitedSpotsTotal,
    visitedWorldPercent,
    flowsPoints,
    travelerLevelLabel,
    currentTravelerLevel,
    refetch: load,
  };
}
