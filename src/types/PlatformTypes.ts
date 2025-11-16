export type UserRole = 'player' | 'developer' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DeveloperProfile {
  id: string;
  studio_name: string | null;
  website_url: string | null;
  verified: boolean;
  total_games: number;
  total_revenue: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export type GameProjectStatus = 'draft' | 'testing' | 'published' | 'archived';

export interface GameProject {
  id: string;
  developer_id: string;
  title: string;
  description: string | null;
  version: string;
  status: GameProjectStatus;
  thumbnail_url: string | null;
  banner_url: string | null;
  category: string | null;
  tags: string[];
  engine_config: Record<string, any>;
  game_settings: Record<string, any>;
  starting_scenario: any | null;
  total_plays: number;
  total_players: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type StoreVisibility = 'public' | 'unlisted' | 'private';

export interface GameStoreListing {
  id: string;
  game_project_id: string;
  visibility: StoreVisibility;
  price_grind: number;
  is_free: boolean;
  featured: boolean;
  featured_order: number | null;
  short_description: string | null;
  long_description: string | null;
  screenshots: string[];
  video_url: string | null;
  system_requirements: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export type GameAssetType = 'model' | 'texture' | 'audio' | 'script' | 'config' | 'other';

export interface GameAsset {
  id: string;
  game_project_id: string;
  asset_type: GameAssetType;
  asset_name: string;
  asset_url: string;
  file_size: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GrindWallet {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'purchase' | 'reward' | 'transfer' | 'refund' | 'developer_payout';

export interface GrindTransaction {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  amount: number;
  transaction_type: TransactionType;
  related_game_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GameReview {
  id: string;
  game_project_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface GameAnalytics {
  id: string;
  game_project_id: string;
  metric_date: string;
  plays_count: number;
  unique_players: number;
  total_playtime_minutes: number;
  average_session_minutes: number;
  new_players: number;
  returning_players: number;
  revenue_grind: number;
  created_at: string;
  updated_at: string;
}

export type GameAccessType = 'owned' | 'trial' | 'demo' | 'developer';

export interface GameAccess {
  id: string;
  user_id: string;
  game_project_id: string;
  access_type: GameAccessType;
  purchased_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface GameProjectWithListing extends GameProject {
  listing?: GameStoreListing;
  developer?: DeveloperProfile & { user_profile?: UserProfile };
}

export interface GameStoreItem {
  project: GameProject;
  listing: GameStoreListing;
  developer: DeveloperProfile;
  user_profile: UserProfile;
  reviews_count: number;
  has_access: boolean;
}
