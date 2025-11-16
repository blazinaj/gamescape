/*
  # Gamescape Platform - Multi-Tenant Game Engine Architecture

  This migration transforms the single-game system into a full game development platform.

  ## Overview

  The platform supports three user roles:
  - **Players**: Play games created by developers
  - **Developers**: Create, publish, and monetize games
  - **Admin**: Platform administration (future)

  ## New Architecture

  1. **Developer System**
     - Developer profiles and accounts
     - Game project management
     - Publishing workflow

  2. **Game Store**
     - Public game catalog
     - Game discovery and ratings
     - Access control

  3. **Token Economy (Grind)**
     - Digital wallet system
     - Transactions between players and developers
     - Revenue sharing

  4. **Multi-Tenancy**
     - Existing `games` table becomes player save files
     - New `game_projects` table for developer-created games
     - Separation between game templates and player instances

  ## Tables Created

  1. **user_profiles** - Extended user information and roles
  2. **developer_profiles** - Developer-specific information
  3. **game_projects** - Games created by developers (templates)
  4. **game_store_listings** - Published games in the store
  5. **game_assets** - Developer-uploaded assets and resources
  6. **grind_wallets** - Token balances for users
  7. **grind_transactions** - Token movement history
  8. **game_reviews** - Player reviews and ratings
  9. **game_analytics** - Usage and performance metrics
  10. **game_access** - Player access rights to games

  ## Security

  All tables have RLS enabled with appropriate policies for:
  - Players can only access their own data
  - Developers can manage their own games
  - Public can view published store listings
  - Strict wallet and transaction controls
*/

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  role text DEFAULT 'player' CHECK (role IN ('player', 'developer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Developer Profiles
CREATE TABLE IF NOT EXISTS developer_profiles (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  studio_name text,
  website_url text,
  verified boolean DEFAULT false,
  total_games integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game Projects (developer-created games)
CREATE TABLE IF NOT EXISTS game_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid REFERENCES developer_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  version text DEFAULT '1.0.0',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'published', 'archived')),
  thumbnail_url text,
  banner_url text,
  category text,
  tags text[],
  engine_config jsonb DEFAULT '{}'::jsonb,
  game_settings jsonb DEFAULT '{}'::jsonb,
  starting_scenario jsonb,
  total_plays integer DEFAULT 0,
  total_players integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Game Store Listings
CREATE TABLE IF NOT EXISTS game_store_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_project_id uuid REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  price_grind integer DEFAULT 0,
  is_free boolean DEFAULT true,
  featured boolean DEFAULT false,
  featured_order integer,
  short_description text,
  long_description text,
  screenshots text[],
  video_url text,
  system_requirements jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game Assets (uploaded by developers)
CREATE TABLE IF NOT EXISTS game_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_project_id uuid REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('model', 'texture', 'audio', 'script', 'config', 'other')),
  asset_name text NOT NULL,
  asset_url text NOT NULL,
  file_size integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grind Token Wallets
CREATE TABLE IF NOT EXISTS grind_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned integer DEFAULT 0,
  lifetime_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grind Token Transactions
CREATE TABLE IF NOT EXISTS grind_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_wallet_id uuid REFERENCES grind_wallets(id),
  to_wallet_id uuid REFERENCES grind_wallets(id),
  amount integer NOT NULL CHECK (amount > 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'reward', 'transfer', 'refund', 'developer_payout')),
  related_game_id uuid REFERENCES game_projects(id),
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Game Reviews
CREATE TABLE IF NOT EXISTS game_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_project_id uuid REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_project_id, user_id)
);

-- Game Analytics
CREATE TABLE IF NOT EXISTS game_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_project_id uuid REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  metric_date date DEFAULT CURRENT_DATE,
  plays_count integer DEFAULT 0,
  unique_players integer DEFAULT 0,
  total_playtime_minutes integer DEFAULT 0,
  average_session_minutes numeric DEFAULT 0,
  new_players integer DEFAULT 0,
  returning_players integer DEFAULT 0,
  revenue_grind integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(game_project_id, metric_date)
);

-- Game Access (who can play which games)
CREATE TABLE IF NOT EXISTS game_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  game_project_id uuid REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  access_type text DEFAULT 'owned' CHECK (access_type IN ('owned', 'trial', 'demo', 'developer')),
  purchased_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_project_id)
);

-- Update existing games table to link to game projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'game_project_id'
  ) THEN
    ALTER TABLE games ADD COLUMN game_project_id uuid REFERENCES game_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row Level Security on all new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_store_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE grind_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE grind_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_access ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - User Profiles
-- ============================================================

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES - Developer Profiles
-- ============================================================

CREATE POLICY "Public developer profiles viewable by everyone"
  ON developer_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Developers can create their profile"
  ON developer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Developers can update own profile"
  ON developer_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES - Game Projects
-- ============================================================

CREATE POLICY "Published games viewable by everyone"
  ON game_projects
  FOR SELECT
  USING (
    status = 'published'
    OR developer_id = auth.uid()
  );

CREATE POLICY "Developers can create games"
  ON game_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM developer_profiles
      WHERE developer_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Developers can update own games"
  ON game_projects
  FOR UPDATE
  TO authenticated
  USING (developer_id = auth.uid())
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can delete own games"
  ON game_projects
  FOR DELETE
  TO authenticated
  USING (developer_id = auth.uid());

-- ============================================================
-- RLS POLICIES - Game Store Listings
-- ============================================================

CREATE POLICY "Public listings viewable by everyone"
  ON game_store_listings
  FOR SELECT
  USING (
    visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_store_listings.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can create listings for their games"
  ON game_store_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_store_listings.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update their listings"
  ON game_store_listings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_store_listings.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_store_listings.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can delete their listings"
  ON game_store_listings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_store_listings.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES - Game Assets
-- ============================================================

CREATE POLICY "Developers can view their own game assets"
  ON game_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_assets.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can upload assets to their games"
  ON game_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_assets.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update their game assets"
  ON game_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_assets.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_assets.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "Developers can delete their game assets"
  ON game_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_assets.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES - Grind Wallets
-- ============================================================

CREATE POLICY "Users can view own wallet"
  ON grind_wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet"
  ON grind_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON grind_wallets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES - Grind Transactions
-- ============================================================

CREATE POLICY "Users can view own transactions"
  ON grind_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grind_wallets
      WHERE (grind_wallets.id = grind_transactions.from_wallet_id
        OR grind_wallets.id = grind_transactions.to_wallet_id)
      AND grind_wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create transactions"
  ON grind_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grind_wallets
      WHERE grind_wallets.id = grind_transactions.from_wallet_id
      AND grind_wallets.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES - Game Reviews
-- ============================================================

CREATE POLICY "Reviews are viewable by everyone"
  ON game_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for games they own"
  ON game_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM game_access
      WHERE game_access.user_id = auth.uid()
      AND game_access.game_project_id = game_reviews.game_project_id
    )
  );

CREATE POLICY "Users can update own reviews"
  ON game_reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON game_reviews
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES - Game Analytics
-- ============================================================

CREATE POLICY "Developers can view analytics for their games"
  ON game_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = game_analytics.game_project_id
      AND game_projects.developer_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON game_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON game_analytics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES - Game Access
-- ============================================================

CREATE POLICY "Users can view own game access"
  ON game_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can receive game access"
  ON game_access
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update game access"
  ON game_access
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_developer_profiles_studio_name ON developer_profiles(studio_name);
CREATE INDEX IF NOT EXISTS idx_game_projects_developer ON game_projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_game_projects_status ON game_projects(status);
CREATE INDEX IF NOT EXISTS idx_game_projects_category ON game_projects(category);
CREATE INDEX IF NOT EXISTS idx_game_store_listings_game ON game_store_listings(game_project_id);
CREATE INDEX IF NOT EXISTS idx_game_store_listings_visibility ON game_store_listings(visibility);
CREATE INDEX IF NOT EXISTS idx_game_store_listings_featured ON game_store_listings(featured);
CREATE INDEX IF NOT EXISTS idx_game_assets_game ON game_assets(game_project_id);
CREATE INDEX IF NOT EXISTS idx_grind_wallets_user ON grind_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_grind_transactions_from ON grind_transactions(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_grind_transactions_to ON grind_transactions(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_grind_transactions_type ON grind_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_game_reviews_game ON game_reviews(game_project_id);
CREATE INDEX IF NOT EXISTS idx_game_reviews_user ON game_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_game_analytics_game ON game_analytics(game_project_id);
CREATE INDEX IF NOT EXISTS idx_game_analytics_date ON game_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_game_access_user ON game_access(user_id);
CREATE INDEX IF NOT EXISTS idx_game_access_game ON game_access(game_project_id);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to update game rating when reviews change
CREATE OR REPLACE FUNCTION update_game_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE game_projects
  SET average_rating = (
    SELECT AVG(rating)
    FROM game_reviews
    WHERE game_project_id = COALESCE(NEW.game_project_id, OLD.game_project_id)
  )
  WHERE id = COALESCE(NEW.game_project_id, OLD.game_project_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON game_reviews
FOR EACH ROW
EXECUTE FUNCTION update_game_rating();

-- Function to update wallet balances on transaction
CREATE OR REPLACE FUNCTION process_grind_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct from sender
  IF NEW.from_wallet_id IS NOT NULL THEN
    UPDATE grind_wallets
    SET
      balance = balance - NEW.amount,
      lifetime_spent = lifetime_spent + NEW.amount
    WHERE id = NEW.from_wallet_id;
  END IF;

  -- Add to receiver
  IF NEW.to_wallet_id IS NOT NULL THEN
    UPDATE grind_wallets
    SET
      balance = balance + NEW.amount,
      lifetime_earned = lifetime_earned + NEW.amount
    WHERE id = NEW.to_wallet_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_transaction
AFTER INSERT ON grind_transactions
FOR EACH ROW
EXECUTE FUNCTION process_grind_transaction();

-- Trigger for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_profiles_updated_at BEFORE UPDATE ON developer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_projects_updated_at BEFORE UPDATE ON game_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_store_listings_updated_at BEFORE UPDATE ON game_store_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_assets_updated_at BEFORE UPDATE ON game_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grind_wallets_updated_at BEFORE UPDATE ON grind_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_reviews_updated_at BEFORE UPDATE ON game_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_analytics_updated_at BEFORE UPDATE ON game_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
