export type AppMode = 'store' | 'play' | 'develop';

export interface AppState {
  mode: AppMode;
  currentGameId: string | null;
  currentProjectId: string | null;
}

export interface NavigationContext {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  navigateToStore: () => void;
  navigateToPlay: (gameId: string) => void;
  navigateToDevelop: (projectId?: string) => void;
}
