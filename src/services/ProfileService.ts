import { supabase } from '../lib/supabase';
import { UserProfile, DeveloperProfile, UserRole } from '../types/PlatformTypes';

export class ProfileService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async createUserProfile(
    userId: string,
    username: string,
    displayName?: string,
    role: UserRole = 'player'
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          username,
          display_name: displayName || null,
          role,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  }

  async upgradeToDeveoper(userId: string): Promise<boolean> {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ role: 'developer' })
      .eq('id', userId);

    if (profileError) {
      console.error('Error upgrading to developer:', profileError);
      return false;
    }

    const { error: devProfileError } = await supabase
      .from('developer_profiles')
      .insert([{ id: userId }]);

    if (devProfileError) {
      console.error('Error creating developer profile:', devProfileError);
      return false;
    }

    return true;
  }

  async getDeveloperProfile(userId: string): Promise<DeveloperProfile | null> {
    const { data, error } = await supabase
      .from('developer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching developer profile:', error);
      return null;
    }

    return data;
  }

  async updateDeveloperProfile(
    userId: string,
    updates: Partial<Omit<DeveloperProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<DeveloperProfile | null> {
    const { data, error } = await supabase
      .from('developer_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating developer profile:', error);
      return null;
    }

    return data;
  }

  async getProfileWithDeveloperInfo(userId: string): Promise<{
    profile: UserProfile;
    developer?: DeveloperProfile;
  } | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    if (profile.role === 'developer' || profile.role === 'admin') {
      const developer = await this.getDeveloperProfile(userId);
      return { profile, developer: developer || undefined };
    }

    return { profile };
  }

  async ensureUserProfile(userId: string, username: string): Promise<UserProfile | null> {
    let profile = await this.getUserProfile(userId);

    if (!profile) {
      profile = await this.createUserProfile(userId, username);
    }

    return profile;
  }
}

export const profileService = new ProfileService();
