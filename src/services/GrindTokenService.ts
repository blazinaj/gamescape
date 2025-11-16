import { localStorageService } from './LocalStorageService';
import { GrindWallet, GrindTransaction, TransactionType } from '../types/PlatformTypes';

export class GrindTokenService {
  private transactions: GrindTransaction[] = [];

  async getWallet(userId: string): Promise<GrindWallet | null> {
    const wallet = localStorageService.getWallet(userId);
    if (!wallet) return null;

    return {
      id: userId,
      user_id: userId,
      balance: wallet.balance,
      lifetime_earned: wallet.lifetimeEarned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async createWallet(userId: string): Promise<GrindWallet | null> {
    localStorageService.createWallet(userId, 0);
    return this.getWallet(userId);
  }

  async ensureWallet(userId: string): Promise<GrindWallet | null> {
    let wallet = await this.getWallet(userId);

    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return wallet;
  }

  async getTransactions(userId: string, limit: number = 50): Promise<GrindTransaction[]> {
    return this.transactions.filter(t =>
      t.from_wallet_id === userId || t.to_wallet_id === userId
    ).slice(0, limit);
  }

  async purchaseGame(
    buyerUserId: string,
    gameProjectId: string,
    amount: number,
    developerUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const buyerWallet = await this.getWallet(buyerUserId);
    const developerWallet = await this.getWallet(developerUserId);

    if (!buyerWallet) {
      return { success: false, error: 'Buyer wallet not found' };
    }

    if (!developerWallet) {
      return { success: false, error: 'Developer wallet not found' };
    }

    if (buyerWallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const platformFee = Math.floor(amount * 0.1);
    const developerAmount = amount - platformFee;

    localStorageService.updateWalletBalance(buyerUserId, -amount);
    localStorageService.updateWalletBalance(developerUserId, developerAmount);

    this.transactions.push({
      id: crypto.randomUUID(),
      from_wallet_id: buyerUserId,
      to_wallet_id: developerUserId,
      amount: developerAmount,
      transaction_type: 'purchase',
      related_game_id: gameProjectId,
      description: 'Game purchase',
      metadata: { platform_fee: platformFee },
      created_at: new Date().toISOString(),
    });

    return { success: true };
  }

  async awardGrind(
    userId: string,
    amount: number,
    description: string,
    relatedGameId?: string
  ): Promise<boolean> {
    await this.ensureWallet(userId);
    localStorageService.updateWalletBalance(userId, amount);

    this.transactions.push({
      id: crypto.randomUUID(),
      from_wallet_id: null,
      to_wallet_id: userId,
      amount,
      transaction_type: 'reward',
      related_game_id: relatedGameId || null,
      description,
      metadata: null,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  async transferGrind(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    const fromWallet = await this.getWallet(fromUserId);
    const toWallet = await this.getWallet(toUserId);

    if (!fromWallet) {
      return { success: false, error: 'Sender wallet not found' };
    }

    if (!toWallet) {
      return { success: false, error: 'Recipient wallet not found' };
    }

    if (fromWallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    localStorageService.updateWalletBalance(fromUserId, -amount);
    localStorageService.updateWalletBalance(toUserId, amount);

    this.transactions.push({
      id: crypto.randomUUID(),
      from_wallet_id: fromUserId,
      to_wallet_id: toUserId,
      amount,
      transaction_type: 'transfer',
      related_game_id: null,
      description: description || 'Transfer',
      metadata: null,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  }

  async getWalletWithTransactions(userId: string): Promise<{
    wallet: GrindWallet | null;
    recent_transactions: GrindTransaction[];
  }> {
    const wallet = await this.getWallet(userId);
    const transactions = await this.getTransactions(userId, 10);

    return {
      wallet,
      recent_transactions: transactions,
    };
  }

  formatGrindAmount(amount: number): string {
    return `${amount.toLocaleString()} G`;
  }
}

export const grindTokenService = new GrindTokenService();
