-- Persist Mapbox camera hints (bbox + feature type) when creating spots from search/POI
-- so reframing matches the same fitBounds / wide-zoom behavior as before saving.

ALTER TABLE spots ADD COLUMN IF NOT EXISTS mapbox_feature_type text;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS mapbox_bbox jsonb;
