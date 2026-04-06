/*
  # Allow reading assets in all statuses

  1. Changes
    - Update the SELECT policy on asset_library to allow reading all assets, not just completed ones
    - This enables the Asset Library Browser to show pending and failed assets with their generation status

  2. Security
    - Only affects SELECT (read) access
    - Insert/update policies remain unchanged
*/

DROP POLICY IF EXISTS "Anyone can view completed assets" ON asset_library;

CREATE POLICY "Anyone can view all assets"
  ON asset_library FOR SELECT
  USING (true);
