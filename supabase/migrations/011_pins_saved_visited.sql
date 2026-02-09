-- Pins: modelo saved + visited independientes (reemplaza status exclusivo).
-- Un spot puede ser guardado y visitado a la vez. status se mantiene como legacy (derivado al escribir).

-- Nuevas columnas (aditivas; no tocan columnas existentes)
ALTER TABLE pins
  ADD COLUMN IF NOT EXISTS saved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visited boolean NOT NULL DEFAULT false;

-- Backfill desde status legacy. Idempotente: solo actualiza filas con saved=false AND visited=false,
-- así no se sobrescriben valores ya guardados por la app. Seguro re-ejecutar.
UPDATE pins
SET
  saved = (status = 'to_visit'),
  visited = (status = 'visited')
WHERE saved = false AND visited = false;

-- status se sigue escribiendo desde la app como derivado (visited > saved > to_visit) para compatibilidad.
COMMENT ON COLUMN pins.status IS 'LEGACY: derivado de saved/visited. Fuente de verdad: saved, visited.';
