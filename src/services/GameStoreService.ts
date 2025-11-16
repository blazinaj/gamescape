import { supabase } from '../lib/supabase';
import { GameStoreItem, GameProject, GameStoreListing } from '../types/PlatformTypes';

export class GameStoreService {
  async getFeaturedGames(limit: number = 10): Promise<GameStoreItem[]> {
    const { data, error } = await supabase
      .from('game_store_listings')
      .select(`
        *,
        project:game_projects!inner(*),
        developer:game_projects!inner(developer_profiles!inner(*))
      `)
      .eq('visibility', 'public')
      .eq('featured', true)
      .eq('project.status', 'published')
      .order('featured_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured games:', error);
      return [];
    }

    return this.formatStoreItems(data);
  }

  async getPublishedGames(
    options: {
      category?: string;
      search?: string;
      sortBy?: 'recent' | 'popular' | 'rating';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<GameStoreItem[]> {
    let query = supabase
      .from('game_store_listings')
      .select(`
        *,
        project:game_projects!inner(*),
        developer:game_projects!inner(developer_profiles!inner(*))
      `)
      .eq('visibility', 'public')
      .eq('project.status', 'published');

    if (options.category) {
      query = query.eq('project.category', options.category);
    }

    if (options.search) {
      query = query.or(
        `project.title.ilike.%${options.search}%,project.description.ilike.%${options.search}%`
      );
    }

    switch (options.sortBy) {
      case 'popular':
        query = query.order('project.total_plays', { ascending: false });
        break;
      case 'rating':
        query = query.order('project.average_rating', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('project.published_at', { ascending: false });
        break;
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching published games:', error);
      return [];
    }

    return this.formatStoreItems(data);
  }

  async getGamesByCategory(category: string, limit: number = 20): Promise<GameStoreItem[]> {
    return this.getPublishedGames({ category, limit });
  }

  async searchGames(searchTerm: string, limit: number = 20): Promise<GameStoreItem[]> {
    return this.getPublishedGames({ search: searchTerm, limit });
  }

  async getUserOwnedGames(userId: string): Promise<GameStoreItem[]> {
    const { data, error } = await supabase
      .from('game_access')
      .select(`
        *,
        project:game_projects!inner(*),
        listing:game_projects!inner(game_store_listings(*)),
        developer:game_projects!inner(developer_profiles!inner(*))
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user owned games:', error);
      return [];
    }

    return this.formatStoreItems(data);
  }

  async checkUserAccess(userId: string, gameProjectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('game_access')
      .select('id')
      .eq('user_id', userId)
      .eq('game_project_id', gameProjectId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user access:', error);
      return false;
    }

    return !!data;
  }

  async grantAccess(
    userId: string,
    gameProjectId: string,
    accessType: 'owned' | 'trial' | 'demo' | 'developer' = 'owned'
  ): Promise<boolean> {
    const { error } = await supabase.from('game_access').insert([
      {
        user_id: userId,
        game_project_id: gameProjectId,
        access_type: accessType,
        purchased_at: accessType === 'owned' ? new Date().toISOString() : null,
      },
    ]);

    if (error) {
      console.error('Error granting access:', error);
      return false;
    }

    return true;
  }

  private formatStoreItems(data: any[]): GameStoreItem[] {
    return data.map((item) => ({
      project: item.project,
      listing: item.listing || item,
      developer: item.developer,
      user_profile: item.user_profile,
      reviews_count: 0,
      has_access: false,
    }));
  }

  async getGameReviews(gameProjectId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('game_reviews')
      .select(`
        *,
        user:user_profiles(username, display_name, avatar_url)
      `)
      .eq('game_project_id', gameProjectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching game reviews:', error);
      return [];
    }

    return data || [];
  }

  async submitReview(
    userId: string,
    gameProjectId: string,
    rating: number,
    reviewText?: string
  ): Promise<boolean> {
    const { error } = await supabase.from('game_reviews').upsert(
      [
        {
          user_id: userId,
          game_project_id: gameProjectId,
          rating,
          review_text: reviewText || null,
        },
      ],
      {
        onConflict: 'game_project_id,user_id',
      }
    );

    if (error) {
      console.error('Error submitting review:', error);
      return false;
    }

    return true;
  }
}

export const gameStoreService = new GameStoreService();
