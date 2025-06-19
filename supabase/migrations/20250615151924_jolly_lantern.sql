/*
  # Game Save System

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, save slot name)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `player_position` (jsonb, player x,y,z coordinates)
      - `player_rotation` (jsonb, player rotation)
      - `current_biome` (text)
      - `play_time` (integer, in seconds)
    
    - `map_tiles`
      - `id` (uuid, primary key)
      - `game_id` (uuid, references games)
      - `tile_x` (integer)
      - `tile_z` (integer)
      - `biome` (text)
      - `objects` (jsonb, array of objects)
      - `description` (text)
      - `theme` (text)
      - `generated_at` (timestamp)
    
    - `npc_states`
      - `id` (uuid, primary key)
      - `game_id` (uuid, references games)
      - `npc_id` (text)
      - `has_talked` (boolean)
      - `conversation_count` (integer)
      - `last_interaction` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own game data
*/

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  player_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  player_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0, "w": 1}'::jsonb,
  current_biome text DEFAULT 'grassland',
  play_time integer DEFAULT 0
);

-- Map tiles table
CREATE TABLE IF NOT EXISTS map_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  tile_x integer NOT NULL,
  tile_z integer NOT NULL,
  biome text NOT NULL,
  objects jsonb DEFAULT '[]'::jsonb,
  description text DEFAULT '',
  theme text DEFAULT '',
  generated_at timestamptz DEFAULT now(),
  UNIQUE(game_id, tile_x, tile_z)
);

-- NPC states table
CREATE TABLE IF NOT EXISTS npc_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  npc_id text NOT NULL,
  has_talked boolean DEFAULT false,
  conversation_count integer DEFAULT 0,
  last_interaction timestamptz,
  UNIQUE(game_id, npc_id)
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games table
CREATE POLICY "Users can read own games"
  ON games
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
  ON games
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for map_tiles table
CREATE POLICY "Users can read own map tiles"
  ON map_tiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = map_tiles.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own map tiles"
  ON map_tiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = map_tiles.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own map tiles"
  ON map_tiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = map_tiles.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own map tiles"
  ON map_tiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = map_tiles.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- RLS Policies for npc_states table
CREATE POLICY "Users can read own npc states"
  ON npc_states
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = npc_states.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own npc states"
  ON npc_states
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = npc_states.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own npc states"
  ON npc_states
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = npc_states.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own npc states"
  ON npc_states
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = npc_states.game_id 
      AND games.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_map_tiles_game_id ON map_tiles(game_id);
CREATE INDEX IF NOT EXISTS idx_map_tiles_coords ON map_tiles(game_id, tile_x, tile_z);
CREATE INDEX IF NOT EXISTS idx_npc_states_game_id ON npc_states(game_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();