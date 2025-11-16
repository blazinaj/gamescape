import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { grindTokenService } from '../services/GrindTokenService';
import { GrindWallet, GrindTransaction } from '../types/PlatformTypes';

export const useGrindWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<GrindWallet | null>(null);
  const [transactions, setTransactions] = useState<GrindTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWallet();
    } else {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const loadWallet = async () => {
    if (!user) return;

    setLoading(true);
    const data = await grindTokenService.getWalletWithTransactions(user.id);

    setWallet(data.wallet);
    setTransactions(data.recent_transactions);
    setLoading(false);
  };

  const ensureWallet = async (): Promise<GrindWallet | null> => {
    if (!user) return null;

    if (wallet) return wallet;

    const newWallet = await grindTokenService.ensureWallet(user.id);
    if (newWallet) {
      setWallet(newWallet);
    }

    return newWallet;
  };

  const purchaseGame = async (
    gameProjectId: string,
    amount: number,
    developerUserId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const result = await grindTokenService.purchaseGame(
      user.id,
      gameProjectId,
      amount,
      developerUserId
    );

    if (result.success) {
      await loadWallet();
    }

    return result;
  };

  const transferGrind = async (
    toUserId: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const result = await grindTokenService.transferGrind(
      user.id,
      toUserId,
      amount,
      description
    );

    if (result.success) {
      await loadWallet();
    }

    return result;
  };

  return {
    wallet,
    transactions,
    loading,
    balance: wallet?.balance || 0,
    lifetimeEarned: wallet?.lifetime_earned || 0,
    lifetimeSpent: wallet?.lifetime_spent || 0,
    ensureWallet,
    purchaseGame,
    transferGrind,
    reloadWallet: loadWallet,
    formatAmount: grindTokenService.formatGrindAmount,
  };
};
