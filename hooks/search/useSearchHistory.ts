/**
 * Historial de queries completadas (máx 5). Solo agregar cuando el usuario seleccionó un resultado.
 */

import { useCallback, useState } from 'react';
import { addSearchHistoryQuery, getSearchHistory } from '@/lib/storage/searchHistory';

const MAX_RECENT = 5;

export function useSearchHistory() {
  const [recentQueries, setRecentQueries] = useState<string[]>(() => getSearchHistory());

  const refresh = useCallback(() => {
    setRecentQueries(getSearchHistory());
  }, []);

  const addCompletedQuery = useCallback((query: string) => {
    addSearchHistoryQuery(query);
    setRecentQueries(getSearchHistory());
  }, []);

  return {
    recentQueries: recentQueries.slice(0, MAX_RECENT),
    addCompletedQuery,
    refresh,
  };
}
