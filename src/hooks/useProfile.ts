import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { profileService } from '../services/ProfileService';
import { UserProfile, DeveloperProfile } from '../types/PlatformTypes';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setDeveloperProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    const data = await profileService.getProfileWithDeveloperInfo(user.id);

    if (data) {
      setProfile(data.profile);
      setDeveloperProfile(data.developer || null);
    }

    setLoading(false);
  };

  const upgradeToDeveloper = async (): Promise<boolean> => {
    if (!user) return false;

    const success = await profileService.upgradeToDeveoper(user.id);

    if (success) {
      await loadProfile();
    }

    return success;
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    const updated = await profileService.updateUserProfile(user.id, updates);

    if (updated) {
      setProfile(updated);
      return true;
    }

    return false;
  };

  const updateDeveloperProfile = async (
    updates: Partial<DeveloperProfile>
  ): Promise<boolean> => {
    if (!user) return false;

    const updated = await profileService.updateDeveloperProfile(user.id, updates);

    if (updated) {
      setDeveloperProfile(updated);
      return true;
    }

    return false;
  };

  return {
    profile,
    developerProfile,
    loading,
    isDeveloper: profile?.role === 'developer' || profile?.role === 'admin',
    isAdmin: profile?.role === 'admin',
    upgradeToDeveloper,
    updateProfile,
    updateDeveloperProfile,
    reloadProfile: loadProfile,
  };
};
