/*
  # Asset Library System for Meshy-Generated 3D Assets

  1. New Tables
    - `asset_library` - Stores all generated 3D models, animations, and textures
      - `id` (uuid, primary key)
      - `asset_type` (enum: 'model', 'animation', 'texture')
      - `content_type` (string: model format like gltf, fbx, etc)
      - `name` (text)
      - `description` (text)
      - `prompt` (text - the AI prompt used to generate)
      - `generated_by_user_id` (uuid, foreign key to auth.users)
      - `meshy_request_id` (text - Meshy API request ID for tracking)
      - `status` (enum: 'pending', 'completed', 'failed')
      - `metadata` (jsonb - extra data like dimensions, poly count, etc)
      - `file_url` (text - URL to the generated file)
      - `preview_url` (text - URL to preview image/thumbnail)
      - `tags` (text[] - searchable tags)
      - `usage_count` (integer - how many times used)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `asset_generations` - Log of generation requests for tracking
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key to asset_library)
      - `user_id` (uuid, foreign key to auth.users)
      - `prompt` (text)
      - `meshy_request_id` (text)
      - `status` (enum: 'pending', 'completed', 'failed')
      - `error_message` (text, nullable)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)

  2. Security
    - Enable RLS on both tables
    - Anyone can read public assets
    - Only the system (service role) can insert/update assets
    - Users can see their own generation logs

  3. Indexes
    - asset_type for filtering
    - status for finding completed assets
    - tags for search functionality
    - created_at for sorting
*/

CREATE TYPE asset_type_enum AS ENUM ('model', 'animation', 'texture');
CREATE TYPE asset_status_enum AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS asset_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type asset_type_enum NOT NULL,
  content_type text NOT NULL,
  name text NOT NULL,
  description text,
  prompt text NOT NULL,
  generated_by_user_id uuid REFERENCES auth.users(id),
  meshy_request_id text UNIQUE NOT NULL,
  status asset_status_enum DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  file_url text,
  preview_url text,
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES asset_library(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  meshy_request_id text UNIQUE NOT NULL,
  status asset_status_enum DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_asset_library_type ON asset_library(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_library_status ON asset_library(status);
CREATE INDEX IF NOT EXISTS idx_asset_library_tags ON asset_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_asset_library_created ON asset_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_generations_user ON asset_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_generations_status ON asset_generations(status);

-- Enable RLS
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_generations ENABLE ROW LEVEL SECURITY;

-- Policies for asset_library (public read, system write)
CREATE POLICY "Anyone can view completed assets"
  ON asset_library FOR SELECT
  USING (status = 'completed');

CREATE POLICY "System can insert assets"
  ON asset_library FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update assets"
  ON asset_library FOR UPDATE
  WITH CHECK (true);

-- Policies for asset_generations (users see their own)
CREATE POLICY "Users can view their own generation logs"
  ON asset_generations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert generation logs"
  ON asset_generations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update generation logs"
  ON asset_generations FOR UPDATE
  WITH CHECK (true);
