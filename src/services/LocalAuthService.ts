import { localStorageService } from './LocalStorageService';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
}

type AuthChangeCallback = (event: 'SIGNED_IN' | 'SIGNED_OUT', session: AuthState['session']) => void;

class LocalAuthService {
  private listeners: AuthChangeCallback[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const userId = localStorageService.getCurrentUserId();
    if (userId) {
      const profile = localStorageService.getProfile(userId);
      if (profile) {
        this.currentUser = {
          id: userId,
          email: profile.username + '@local',
        };
      }
    }
  }

  getUser(): User | null {
    return this.currentUser;
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const userId = crypto.randomUUID();
      this.currentUser = { id: userId, email };
      localStorageService.setCurrentUserId(userId);

      this.notifyListeners('SIGNED_IN', { access_token: userId });

      return { user: this.currentUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const profiles = Object.values((localStorageService as any).getData().profiles);
      const profile = profiles.find((p: any) => p.username + '@local' === email);

      if (!profile) {
        throw new Error('Invalid credentials');
      }

      this.currentUser = { id: (profile as any).id, email };
      localStorageService.setCurrentUserId((profile as any).id);

      this.notifyListeners('SIGNED_IN', { access_token: (profile as any).id });

      return { user: this.currentUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorageService.setCurrentUserId(null);
    localStorageService.clearGuestCredentials();
    this.notifyListeners('SIGNED_OUT', null);
  }

  onAuthStateChange(callback: AuthChangeCallback): { unsubscribe: () => void } {
    this.listeners.push(callback);

    if (this.currentUser) {
      setTimeout(() => {
        callback('SIGNED_IN', { access_token: this.currentUser!.id });
      }, 0);
    }

    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      },
    };
  }

  private notifyListeners(event: 'SIGNED_IN' | 'SIGNED_OUT', session: AuthState['session']): void {
    this.listeners.forEach(callback => callback(event, session));
  }
}

export const localAuthService = new LocalAuthService();
