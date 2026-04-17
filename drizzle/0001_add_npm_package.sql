-- Add npm_package column for fetching weekly download stats
ALTER TABLE tools ADD COLUMN IF NOT EXISTS npm_package TEXT;
