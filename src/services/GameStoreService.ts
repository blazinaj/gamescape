import { GameStoreItem, GameProject, GameStoreListing } from '../types/PlatformTypes';
import { SAMPLE_GAMES } from '../data/sampleGames';

export class GameStoreService {
  async getFeaturedGames(limit: number = 10): Promise<GameStoreItem[]> {
    return SAMPLE_GAMES.filter(game => game.listing.featured).slice(0, limit);
  }

  async getPublishedGames(
    options: {
      category?: string;
      search?: string;
      sortBy?: 'recent' | 'popular' | 'rating';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<GameStoreItem[]> {
    let games = [...SAMPLE_GAMES];

    if (options.category) {
      games = games.filter(game => game.project.category === options.category);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      games = games.filter(game =>
        game.project.title.toLowerCase().includes(searchLower) ||
        game.project.description.toLowerCase().includes(searchLower)
      );
    }

    switch (options.sortBy) {
      case 'popular':
        games.sort((a, b) => b.project.total_plays - a.project.total_plays);
        break;
      case 'rating':
        games.sort((a, b) => b.project.average_rating - a.project.average_rating);
        break;
      case 'recent':
      default:
        games.sort((a, b) =>
          new Date(b.project.published_at || 0).getTime() -
          new Date(a.project.published_at || 0).getTime()
        );
        break;
    }

    const offset = options.offset || 0;
    const limit = options.limit || 20;

    return games.slice(offset, offset + limit);
  }

  async searchGames(query: string, limit: number = 20): Promise<GameStoreItem[]> {
    return this.getPublishedGames({ search: query, limit });
  }

  async getGameById(gameId: string): Promise<GameStoreItem | null> {
    return SAMPLE_GAMES.find(game => game.project.id === gameId) || null;
  }

  async getGamesByDeveloper(developerId: string): Promise<GameStoreItem[]> {
    return SAMPLE_GAMES.filter(game => game.project.developer_id === developerId);
  }

  async getGamesByCategory(category: string, limit: number = 20): Promise<GameStoreItem[]> {
    return this.getPublishedGames({ category, limit });
  }
}

export const gameStoreService = new GameStoreService();
