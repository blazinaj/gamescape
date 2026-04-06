/*
  # Fix asset_library meshy_request_id constraint

  1. Changes
    - Make meshy_request_id nullable (optional for non-Meshy generated assets)
    - Remove UNIQUE constraint since nullable fields need special handling
    - Add check constraint to ensure meshy_request_id is unique when not null

  2. Why
    - Code is trying to insert assets without meshy_request_id
    - Assets can come from multiple sources, not just Meshy API
    - Need to support both Meshy and non-Meshy assets
*/

DO $$
BEGIN
  -- Drop existing constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'asset_library' AND column_name = 'meshy_request_id'
  ) THEN
    ALTER TABLE asset_library DROP CONSTRAINT IF EXISTS asset_library_meshy_request_id_key CASCADE;
  END IF;

  -- Make meshy_request_id nullable
  ALTER TABLE asset_library ALTER COLUMN meshy_request_id DROP NOT NULL;
  ALTER TABLE asset_library ALTER COLUMN meshy_request_id SET DEFAULT NULL;

  -- Add unique constraint only for non-null values using a partial index
  CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_library_meshy_request_id_unique 
    ON asset_library(meshy_request_id) 
    WHERE meshy_request_id IS NOT NULL;
END $$;