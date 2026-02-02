-- Flowya: dirección humana persistente en spots
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS)

ALTER TABLE spots
ADD COLUMN IF NOT EXISTS address TEXT;
