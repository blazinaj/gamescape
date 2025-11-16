import { UserProfile, DeveloperProfile } from '../types/PlatformTypes';

interface StorageData {
  profiles: Record<string, UserProfile>;
  developerProfiles: Record<string, DeveloperProfile>;
  wallets: Record<string, { balance: number; lifetimeEarned: number }>;
  currentUserId: string | null;
  guestCredentials: { email: string; password: string } | null;
}

const STORAGE_KEY = 'gamescape_data';

class LocalStorageService {
  private getData(): StorageData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getDefaultData();
      }
    }
    return this.getDefaultData();
  }

  private getDefaultData(): StorageData {
    return {
      profiles: {},
      developerProfiles: {},
      wallets: {},
      currentUserId: null,
      guestCredentials: null,
    };
  }

  private saveData(data: StorageData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  getCurrentUserId(): string | null {
    return this.getData().currentUserId;
  }

  setCurrentUserId(userId: string | null): void {
    const data = this.getData();
    data.currentUserId = userId;
    this.saveData(data);
  }

  getProfile(userId: string): UserProfile | null {
    return this.getData().profiles[userId] || null;
  }

  createProfile(userId: string, profile: Omit<UserProfile, 'id' | 'created_at'>): UserProfile {
    const data = this.getData();
    const newProfile: UserProfile = {
      ...profile,
      id: userId,
      created_at: new Date().toISOString(),
    };
    data.profiles[userId] = newProfile;
    this.saveData(data);
    return newProfile;
  }

  updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const data = this.getData();
    const profile = data.profiles[userId];
    if (!profile) return null;

    const updatedProfile = { ...profile, ...updates };
    data.profiles[userId] = updatedProfile;
    this.saveData(data);
    return updatedProfile;
  }

  getDeveloperProfile(userId: string): DeveloperProfile | null {
    return this.getData().developerProfiles[userId] || null;
  }

  createDeveloperProfile(userId: string): DeveloperProfile {
    const data = this.getData();
    const devProfile: DeveloperProfile = {
      id: userId,
      studio_name: null,
      verified: false,
      total_games: 0,
      total_revenue: 0,
      rating: 0,
      created_at: new Date().toISOString(),
    };
    data.developerProfiles[userId] = devProfile;
    this.saveData(data);
    return devProfile;
  }

  getWallet(userId: string): { balance: number; lifetimeEarned: number } | null {
    return this.getData().wallets[userId] || null;
  }

  createWallet(userId: string, initialBalance: number = 0): void {
    const data = this.getData();
    data.wallets[userId] = {
      balance: initialBalance,
      lifetimeEarned: initialBalance,
    };
    this.saveData(data);
  }

  updateWalletBalance(userId: string, amount: number): void {
    const data = this.getData();
    const wallet = data.wallets[userId];
    if (!wallet) return;

    wallet.balance += amount;
    if (amount > 0) {
      wallet.lifetimeEarned += amount;
    }
    this.saveData(data);
  }

  saveGuestCredentials(email: string, password: string): void {
    const data = this.getData();
    data.guestCredentials = { email, password };
    this.saveData(data);
  }

  getGuestCredentials(): { email: string; password: string } | null {
    return this.getData().guestCredentials;
  }

  clearGuestCredentials(): void {
    const data = this.getData();
    data.guestCredentials = null;
    this.saveData(data);
  }

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const localStorageService = new LocalStorageService();
