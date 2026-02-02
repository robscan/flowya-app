-- Flowya v0: core entities — spots and pins
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS)

-- Spots: physical places users can discover and pin
CREATE TABLE IF NOT EXISTS spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description_short text,
  description_long text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pins: user's relationship to a spot (to_visit or visited)
CREATE TABLE IF NOT EXISTS pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('to_visit', 'visited')),
  created_at timestamptz NOT NULL DEFAULT now()
);
