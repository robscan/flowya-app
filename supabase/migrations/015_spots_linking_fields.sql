-- Spot linking metadata (Phase A)
-- Safe rollout: additive columns + guarded checks + non-destructive indexes.

ALTER TABLE spots
ADD COLUMN IF NOT EXISTS link_status text NOT NULL DEFAULT 'unlinked',
ADD COLUMN IF NOT EXISTS link_score numeric,
ADD COLUMN IF NOT EXISTS linked_place_id text,
ADD COLUMN IF NOT EXISTS linked_place_kind text,
ADD COLUMN IF NOT EXISTS linked_maki text,
ADD COLUMN IF NOT EXISTS linked_at timestamptz,
ADD COLUMN IF NOT EXISTS link_version text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spots_link_status_check'
  ) THEN
    ALTER TABLE spots
    ADD CONSTRAINT spots_link_status_check
    CHECK (link_status IN ('linked', 'uncertain', 'unlinked'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spots_linked_place_kind_check'
  ) THEN
    ALTER TABLE spots
    ADD CONSTRAINT spots_linked_place_kind_check
    CHECK (linked_place_kind IS NULL OR linked_place_kind IN ('poi', 'landmark'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_spots_link_status ON spots (link_status);
CREATE INDEX IF NOT EXISTS idx_spots_linked_place_id ON spots (linked_place_id);
