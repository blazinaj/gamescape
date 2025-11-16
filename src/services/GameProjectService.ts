import { supabase } from '../lib/supabase';
import {
  GameProject,
  GameProjectStatus,
  GameStoreListing,
  GameProjectWithListing,
  StoreVisibility,
} from '../types/PlatformTypes';

export class GameProjectService {
  async createGameProject(
    developerId: string,
    title: string,
    description?: string
  ): Promise<GameProject | null> {
    const { data, error } = await supabase
      .from('game_projects')
      .insert([
        {
          developer_id: developerId,
          title,
          description: description || null,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating game project:', error);
      return null;
    }

    return data;
  }

  async getGameProject(projectId: string): Promise<GameProject | null> {
    const { data, error } = await supabase
      .from('game_projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game project:', error);
      return null;
    }

    return data;
  }

  async getGameProjectWithListing(projectId: string): Promise<GameProjectWithListing | null> {
    const { data, error } = await supabase
      .from('game_projects')
      .select(`
        *,
        listing:game_store_listings(*),
        developer:developer_profiles(
          *,
          user_profile:user_profiles(*)
        )
      `)
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game project with listing:', error);
      return null;
    }

    return data;
  }

  async getDeveloperProjects(developerId: string): Promise<GameProject[]> {
    const { data, error } = await supabase
      .from('game_projects')
      .select('*')
      .eq('developer_id', developerId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching developer projects:', error);
      return [];
    }

    return data || [];
  }

  async updateGameProject(
    projectId: string,
    updates: Partial<Omit<GameProject, 'id' | 'developer_id' | 'created_at' | 'updated_at'>>
  ): Promise<GameProject | null> {
    const { data, error } = await supabase
      .from('game_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating game project:', error);
      return null;
    }

    return data;
  }

  async publishGameProject(projectId: string): Promise<boolean> {
    const { error } = await supabase
      .from('game_projects')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error publishing game project:', error);
      return false;
    }

    return true;
  }

  async deleteGameProject(projectId: string): Promise<boolean> {
    const { error } = await supabase.from('game_projects').delete().eq('id', projectId);

    if (error) {
      console.error('Error deleting game project:', error);
      return false;
    }

    return true;
  }

  async createStoreListing(
    projectId: string,
    data: {
      visibility?: StoreVisibility;
      price_grind?: number;
      short_description?: string;
      long_description?: string;
      screenshots?: string[];
    }
  ): Promise<GameStoreListing | null> {
    const { data: listing, error } = await supabase
      .from('game_store_listings')
      .insert([
        {
          game_project_id: projectId,
          visibility: data.visibility || 'public',
          price_grind: data.price_grind || 0,
          is_free: (data.price_grind || 0) === 0,
          short_description: data.short_description || null,
          long_description: data.long_description || null,
          screenshots: data.screenshots || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating store listing:', error);
      return null;
    }

    return listing;
  }

  async updateStoreListing(
    projectId: string,
    updates: Partial<Omit<GameStoreListing, 'id' | 'game_project_id' | 'created_at' | 'updated_at'>>
  ): Promise<GameStoreListing | null> {
    const { data, error } = await supabase
      .from('game_store_listings')
      .update(updates)
      .eq('game_project_id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating store listing:', error);
      return null;
    }

    return data;
  }

  async getStoreListing(projectId: string): Promise<GameStoreListing | null> {
    const { data, error } = await supabase
      .from('game_store_listings')
      .select('*')
      .eq('game_project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching store listing:', error);
      return null;
    }

    return data;
  }

  async incrementPlayCount(projectId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_play_count', {
      project_id: projectId,
    });

    if (error) {
      console.error('Error incrementing play count:', error);
    }
  }
}

export const gameProjectService = new GameProjectService();
