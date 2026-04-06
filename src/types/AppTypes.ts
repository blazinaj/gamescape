export type AppMode = 'home' | 'create' | 'play' | 'assets';

export interface AppState {
  mode: AppMode;
  currentGameId: string | null;
}
