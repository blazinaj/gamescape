/*
  # Add Scenario Data to Games Table

  1. Updates
    - Add scenario_data field to games table to store scenario information
    - This allows the game to remember which scenario was used for generation

  2. Security
    - No changes to security policies needed as we're modifying an existing table
*/

-- Add scenario_data to games table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'scenario_data'
  ) THEN
    ALTER TABLE games ADD COLUMN scenario_data jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_games_scenario ON games USING gin(scenario_data);

-- Add comment to explain the purpose of the field
COMMENT ON COLUMN games.scenario_data IS 'Stores the scenario context used for world generation';