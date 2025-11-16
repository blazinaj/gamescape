import { localStorageService } from './LocalStorageService';
import { UserProfile, DeveloperProfile, UserRole } from '../types/PlatformTypes';

export class ProfileService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return localStorageService.getProfile(userId);
  }

  async createUserProfile(
    userId: string,
    username: string,
    displayName?: string,
    role: UserRole = 'player'
  ): Promise<UserProfile | null> {
    return localStorageService.createProfile(userId, {
      username,
      display_name: displayName || null,
      role,
      bio: null,
      avatar_url: null,
    });
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
  ): Promise<UserProfile | null> {
    return localStorageService.updateProfile(userId, updates);
  }

  async ensureUserProfile(userId: string, username: string): Promise<UserProfile> {
    let profile = await this.getUserProfile(userId);

    if (!profile) {
      profile = await this.createUserProfile(userId, username);
      if (!profile) {
        throw new Error('Failed to create profile');
      }
    }

    return profile;
  }

  async upgradeToDeveoper(userId: string): Promise<boolean> {
    const profile = localStorageService.updateProfile(userId, { role: 'developer' });
    if (!profile) return false;

    localStorageService.createDeveloperProfile(userId);
    return true;
  }

  async getDeveloperProfile(userId: string): Promise<DeveloperProfile | null> {
    return localStorageService.getDeveloperProfile(userId);
  }

  async getProfileWithDeveloperInfo(
    userId: string
  ): Promise<{ profile: UserProfile; developerProfile: DeveloperProfile | null } | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    const developerProfile =
      profile.role === 'developer' ? await this.getDeveloperProfile(userId) : null;

    return { profile, developerProfile };
  }
}

export const profileService = new ProfileService();
