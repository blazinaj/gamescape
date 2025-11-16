/*
  # Sample Games for Gamescape Platform

  This migration adds sample game projects and store listings to demonstrate the platform.

  1. Sample Developer Profile
     - Creates a "Gamescape Studios" developer account

  2. Sample Game Projects
     - Medieval Adventure
     - Space Explorer
     - Mystery Manor
     - Desert Survival
     - Ocean Depths

  3. Store Listings
     - Creates public listings for all sample games
     - Some free, some paid with Grind tokens
     - Varied ratings and play counts
*/

-- Create sample developer user (use a fixed UUID for consistency)
DO $$
DECLARE
  sample_dev_id uuid := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  -- Create auth user if not exists (this won't work in migration, but kept for reference)
  -- In practice, you'll need to create this user through Supabase Auth

  -- Create user profile
  INSERT INTO user_profiles (id, username, display_name, role, bio)
  VALUES (
    sample_dev_id,
    'gamescape_studios',
    'Gamescape Studios',
    'developer',
    'Official game studio showcasing the power of AI-generated worlds'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create developer profile
  INSERT INTO developer_profiles (id, studio_name, verified, total_games, rating)
  VALUES (
    sample_dev_id,
    'Gamescape Studios',
    true,
    5,
    4.7
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Sample Game 1: Medieval Adventure
INSERT INTO game_projects (
  id,
  developer_id,
  title,
  description,
  version,
  status,
  category,
  tags,
  total_plays,
  total_players,
  average_rating,
  published_at,
  starting_scenario
)
VALUES (
  'game-00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Medieval Quest: Kingdom Rising',
  'Embark on an epic medieval adventure through procedurally generated kingdoms. Battle dragons, forge alliances, and build your own castle in this AI-powered fantasy world.',
  '1.2.0',
  'published',
  'Adventure',
  ARRAY['medieval', 'fantasy', 'rpg', 'exploration'],
  15234,
  4521,
  4.8,
  NOW() - INTERVAL '30 days',
  '{"theme": "medieval", "difficulty": "normal", "worldSize": "large"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_store_listings (
  game_project_id,
  visibility,
  price_grind,
  is_free,
  featured,
  featured_order,
  short_description,
  long_description
)
VALUES (
  'game-00000000-0000-0000-0000-000000000001',
  'public',
  0,
  true,
  true,
  1,
  'Epic medieval adventure with procedural kingdoms',
  'Medieval Quest: Kingdom Rising combines classic RPG elements with cutting-edge AI generation. Every playthrough creates a unique kingdom with dynamic NPCs, quests, and storylines. Build your legend as you explore vast procedural landscapes, engage in strategic combat, and make choices that shape the world around you.'
)
ON CONFLICT (game_project_id) DO NOTHING;

-- Sample Game 2: Space Explorer
INSERT INTO game_projects (
  id,
  developer_id,
  title,
  description,
  version,
  status,
  category,
  tags,
  total_plays,
  total_players,
  average_rating,
  published_at,
  starting_scenario
)
VALUES (
  'game-00000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Stellar Horizons',
  'Explore infinite galaxies in this sci-fi adventure. Discover alien civilizations, mine asteroids, and uncover the mysteries of the cosmos.',
  '2.1.0',
  'published',
  'Sci-Fi',
  ARRAY['space', 'exploration', 'sci-fi', 'simulation'],
  8932,
  3104,
  4.6,
  NOW() - INTERVAL '20 days',
  '{"theme": "space", "difficulty": "normal", "galaxyCount": 100}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_store_listings (
  game_project_id,
  visibility,
  price_grind,
  is_free,
  featured,
  featured_order,
  short_description,
  long_description
)
VALUES (
  'game-00000000-0000-0000-0000-000000000002',
  'public',
  250,
  false,
  true,
  2,
  'Infinite space exploration with AI-generated galaxies',
  'Stellar Horizons takes you beyond the stars. Each galaxy is procedurally generated with unique star systems, planets, and alien species. Engage in space combat, trade resources, or become a peaceful explorer documenting new worlds. The choice is yours in this vast universe.'
)
ON CONFLICT (game_project_id) DO NOTHING;

-- Sample Game 3: Mystery Manor
INSERT INTO game_projects (
  id,
  developer_id,
  title,
  description,
  version,
  status,
  category,
  tags,
  total_plays,
  total_players,
  average_rating,
  published_at,
  starting_scenario
)
VALUES (
  'game-00000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Shadows of Ravencrest Manor',
  'Solve supernatural mysteries in a Victorian mansion. Each investigation reveals new secrets in this AI-driven detective adventure.',
  '1.0.5',
  'published',
  'Mystery',
  ARRAY['mystery', 'detective', 'horror', 'puzzle'],
  12456,
  5234,
  4.9,
  NOW() - INTERVAL '15 days',
  '{"theme": "victorian", "mystery": "mansion", "difficulty": "hard"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_store_listings (
  game_project_id,
  visibility,
  price_grind,
  is_free,
  featured,
  featured_order,
  short_description,
  long_description
)
VALUES (
  'game-00000000-0000-0000-0000-000000000003',
  'public',
  0,
  true,
  true,
  3,
  'Victorian mystery with AI-generated investigations',
  'Step into Ravencrest Manor where nothing is as it seems. Each playthrough generates a new mystery with unique clues, suspects, and supernatural elements. Use your detective skills to uncover the truth hidden within the manor''s dark walls. Atmospheric storytelling meets procedural mystery generation.'
)
ON CONFLICT (game_project_id) DO NOTHING;

-- Sample Game 4: Desert Survival
INSERT INTO game_projects (
  id,
  developer_id,
  title,
  description,
  version,
  status,
  category,
  tags,
  total_plays,
  total_players,
  average_rating,
  published_at,
  starting_scenario
)
VALUES (
  'game-00000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Dunes of Destiny',
  'Survive harsh desert environments with limited resources. Adapt to procedurally generated challenges in this survival adventure.',
  '1.3.2',
  'published',
  'Survival',
  ARRAY['survival', 'crafting', 'desert', 'realistic'],
  6543,
  2876,
  4.5,
  NOW() - INTERVAL '10 days',
  '{"theme": "desert", "difficulty": "hard", "weather": "extreme"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_store_listings (
  game_project_id,
  visibility,
  price_grind,
  is_free,
  featured,
  featured_order,
  short_description,
  long_description
)
VALUES (
  'game-00000000-0000-0000-0000-000000000004',
  'public',
  150,
  false,
  false,
  null,
  'Intense desert survival with resource management',
  'Dunes of Destiny challenges you to survive in one of the harshest environments on Earth. Manage water, food, and shelter while navigating procedurally generated desert landscapes. Each playthrough presents new survival scenarios with AI-driven weather systems and dynamic challenges.'
)
ON CONFLICT (game_project_id) DO NOTHING;

-- Sample Game 5: Ocean Depths
INSERT INTO game_projects (
  id,
  developer_id,
  title,
  description,
  version,
  status,
  category,
  tags,
  total_plays,
  total_players,
  average_rating,
  published_at,
  starting_scenario
)
VALUES (
  'game-00000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Abyssal Treasures',
  'Dive into mysterious ocean depths and discover underwater civilizations. Explore procedurally generated marine ecosystems.',
  '1.1.0',
  'published',
  'Exploration',
  ARRAY['underwater', 'exploration', 'adventure', 'discovery'],
  9876,
  3654,
  4.7,
  NOW() - INTERVAL '5 days',
  '{"theme": "ocean", "depth": "deep", "ecosystem": "diverse"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_store_listings (
  game_project_id,
  visibility,
  price_grind,
  is_free,
  featured,
  featured_order,
  short_description,
  long_description
)
VALUES (
  'game-00000000-0000-0000-0000-000000000005',
  'public',
  0,
  true,
  false,
  null,
  'Explore procedurally generated underwater worlds',
  'Abyssal Treasures takes you beneath the waves to explore vast ocean depths. Discover lost underwater civilizations, unique marine life, and hidden treasures. Each dive reveals new procedurally generated ecosystems with AI-driven creatures and mysteries waiting to be uncovered.'
)
ON CONFLICT (game_project_id) DO NOTHING;

-- Add some sample reviews
INSERT INTO game_reviews (game_project_id, user_id, rating, review_text)
VALUES
  ('game-00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 5, 'Amazing medieval world generation! Every playthrough feels unique.'),
  ('game-00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, 'Love exploring the infinite galaxies. Worth every Grind token!'),
  ('game-00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 5, 'Best mystery game I''ve played. The AI makes each case different.')
ON CONFLICT (game_project_id, user_id) DO NOTHING;

-- Update developer stats
UPDATE developer_profiles
SET
  total_games = 5,
  total_revenue = 400,
  rating = 4.7
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Create a wallet for the sample developer
INSERT INTO grind_wallets (user_id, balance, lifetime_earned)
VALUES ('a0000000-0000-0000-0000-000000000001', 5000, 5000)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE game_projects IS 'Sample games added for platform demonstration';
