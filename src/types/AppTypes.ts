export type AppMode = 'home' | 'create' | 'characterCreate' | 'play' | 'assets';

export interface AppState {
  mode: AppMode;
  currentGameId: string | null;
}
