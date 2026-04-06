export type AppMode = 'home' | 'create' | 'play';

export interface AppState {
  mode: AppMode;
  currentGameId: string | null;
}
