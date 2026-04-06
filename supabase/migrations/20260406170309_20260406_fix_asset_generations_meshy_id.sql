/*
  # Fix asset_generations meshy_request_id constraint

  1. Changes
    - Make meshy_request_id nullable in asset_generations table
    - Remove UNIQUE constraint since nullable fields need special handling
    - Add check constraint to ensure meshy_request_id is unique when not null

  2. Why
    - Code is trying to insert generation logs without meshy_request_id
    - Generations can come from multiple sources, not just Meshy API
*/

DO $$
BEGIN
  -- Drop existing constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'asset_generations' AND column_name = 'meshy_request_id'
  ) THEN
    ALTER TABLE asset_generations DROP CONSTRAINT IF EXISTS asset_generations_meshy_request_id_key CASCADE;
  END IF;

  -- Make meshy_request_id nullable
  ALTER TABLE asset_generations ALTER COLUMN meshy_request_id DROP NOT NULL;
  ALTER TABLE asset_generations ALTER COLUMN meshy_request_id SET DEFAULT NULL;

  -- Add unique constraint only for non-null values using a partial index
  CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_generations_meshy_request_id_unique 
    ON asset_generations(meshy_request_id) 
    WHERE meshy_request_id IS NOT NULL;
END $$;