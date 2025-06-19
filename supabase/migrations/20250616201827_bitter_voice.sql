/*
  # Expand Save System for Complete User Data

  1. New Tables
    - `player_skills`
      - Stores experience and skill levels for each player
    - `player_inventory` 
      - Stores inventory items and quantities
    - `player_equipment`
      - Stores equipped tools and weapons
    - `player_settings`
      - Stores character customization and other settings

  2. Updates
    - Add character customization fields to games table
    - Add health and other player stats

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add character customization and health to games table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'character_customization'
  ) THEN
    ALTER TABLE games ADD COLUMN character_customization jsonb DEFAULT '{
      "bodyColor": "#FFDBAC",
      "clothingColor": "#3B82F6", 
      "eyeColor": "#000000",
      "scale": 1.0,
      "headScale": 1.0,
      "bodyWidth": 1.0,
      "armLength": 1.0,
      "legLength": 1.0,
      "name": "Adventurer"
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'health_data'
  ) THEN
    ALTER TABLE games ADD COLUMN health_data jsonb DEFAULT '{
      "current": 100,
      "maximum": 100,
      "regeneration": 1
    }'::jsonb;
  END IF;
END $$;

-- Player skills table
CREATE TABLE IF NOT EXISTS player_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  skill_id text NOT NULL,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  total_experience integer DEFAULT 0,
  multiplier real DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_id, skill_id)
);

-- Player inventory table
CREATE TABLE IF NOT EXISTS player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  item_id text NOT NULL,
  quantity integer DEFAULT 1,
  slot_index integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player equipment table
CREATE TABLE IF NOT EXISTS player_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  equipment_type text NOT NULL, -- 'tool' or 'weapon'
  item_id text NOT NULL,
  durability integer NOT NULL,
  max_durability integer NOT NULL,
  is_equipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player settings table (for any additional settings)
CREATE TABLE IF NOT EXISTS player_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_id, setting_key)
);

-- Enable Row Level Security
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_equipment ENABLE ROW LEVEL SECURITY; 
ALTER TABLE player_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_skills
CREATE POLICY "Users can read own skills"
  ON player_skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_skills.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own skills"
  ON player_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_skills.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own skills"
  ON player_skills
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_skills.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own skills"
  ON player_skills
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_skills.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- RLS Policies for player_inventory
CREATE POLICY "Users can read own inventory"
  ON player_inventory
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_inventory.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own inventory"
  ON player_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_inventory.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own inventory"
  ON player_inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_inventory.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own inventory"
  ON player_inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_inventory.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- RLS Policies for player_equipment
CREATE POLICY "Users can read own equipment"
  ON player_equipment
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_equipment.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own equipment"
  ON player_equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_equipment.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own equipment"
  ON player_equipment
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_equipment.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own equipment"
  ON player_equipment
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_equipment.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- RLS Policies for player_settings
CREATE POLICY "Users can read own settings"
  ON player_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_settings.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own settings"
  ON player_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_settings.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own settings"
  ON player_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_settings.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own settings"
  ON player_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = player_settings.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_skills_game_id ON player_skills(game_id);
CREATE INDEX IF NOT EXISTS idx_player_skills_skill_id ON player_skills(game_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_game_id ON player_inventory(game_id);
CREATE INDEX IF NOT EXISTS idx_player_equipment_game_id ON player_equipment(game_id);
CREATE INDEX IF NOT EXISTS idx_player_equipment_equipped ON player_equipment(game_id, is_equipped);
CREATE INDEX IF NOT EXISTS idx_player_settings_game_id ON player_settings(game_id);

-- Triggers for updated_at
CREATE TRIGGER update_player_skills_updated_at BEFORE UPDATE ON player_skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_inventory_updated_at BEFORE UPDATE ON player_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_equipment_updated_at BEFORE UPDATE ON player_equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_settings_updated_at BEFORE UPDATE ON player_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();