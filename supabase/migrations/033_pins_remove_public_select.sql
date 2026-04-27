-- V1 privacy hardening: pins are personal relationships, not public rows.
-- Public discovery that needs aggregate popularity must use k-anonymous RPCs
-- such as public.get_most_visited_spots(), never direct SELECT on pins.

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pins_select_public" ON public.pins;

-- Keep owner reads explicit for authenticated users.
DROP POLICY IF EXISTS "pins SELECT own" ON public.pins;
CREATE POLICY "pins SELECT own"
  ON public.pins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.pins IS
  'Personal saved/visited relationship per user and spot. Direct public SELECT is disabled; public popularity must go through aggregate RPCs.';
