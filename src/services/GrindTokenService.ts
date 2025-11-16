import { supabase } from '../lib/supabase';
import { GrindWallet, GrindTransaction, TransactionType } from '../types/PlatformTypes';

export class GrindTokenService {
  async getWallet(userId: string): Promise<GrindWallet | null> {
    const { data, error } = await supabase
      .from('grind_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }

    return data;
  }

  async createWallet(userId: string): Promise<GrindWallet | null> {
    const { data, error } = await supabase
      .from('grind_wallets')
      .insert([
        {
          user_id: userId,
          balance: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet:', error);
      return null;
    }

    return data;
  }

  async ensureWallet(userId: string): Promise<GrindWallet | null> {
    let wallet = await this.getWallet(userId);

    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return wallet;
  }

  async getTransactions(userId: string, limit: number = 50): Promise<GrindTransaction[]> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];

    const { data, error } = await supabase
      .from('grind_transactions')
      .select('*')
      .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }

  async purchaseGame(
    buyerUserId: string,
    gameProjectId: string,
    amount: number,
    developerUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
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

      const { error } = await supabase.from('grind_transactions').insert([
        {
          from_wallet_id: buyerWallet.id,
          to_wallet_id: developerWallet.id,
          amount: developerAmount,
          transaction_type: 'purchase',
          related_game_id: gameProjectId,
          description: `Game purchase`,
          metadata: {
            platform_fee: platformFee,
          },
        },
      ]);

      if (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: 'Transaction failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in purchaseGame:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }

  async awardGrind(
    userId: string,
    amount: number,
    description: string,
    relatedGameId?: string
  ): Promise<boolean> {
    const wallet = await this.ensureWallet(userId);
    if (!wallet) return false;

    const { error } = await supabase.from('grind_transactions').insert([
      {
        to_wallet_id: wallet.id,
        amount,
        transaction_type: 'reward',
        related_game_id: relatedGameId || null,
        description,
      },
    ]);

    if (error) {
      console.error('Error awarding grind:', error);
      return false;
    }

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

    const { error } = await supabase.from('grind_transactions').insert([
      {
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet.id,
        amount,
        transaction_type: 'transfer',
        description: description || 'Transfer',
      },
    ]);

    if (error) {
      console.error('Error transferring grind:', error);
      return { success: false, error: 'Transfer failed' };
    }

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
