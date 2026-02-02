-- Scope D: pins — un pin por (user_id, spot_id), RLS por usuario
-- Idempotent: safe to re-run

-- Un solo pin por usuario y spot (evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS pins_user_spot_unique ON pins (user_id, spot_id);

-- RLS: cada usuario solo ve y modifica sus propios pins
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pins SELECT own" ON pins;
CREATE POLICY "pins SELECT own" ON pins
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pins INSERT own" ON pins;
CREATE POLICY "pins INSERT own" ON pins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pins UPDATE own" ON pins;
CREATE POLICY "pins UPDATE own" ON pins
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
