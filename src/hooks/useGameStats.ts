import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  winRate: number;
}

export const useGameStats = (connection: Connection) => {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    winRate: 0,
  });

  const updateBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
    }
  }, [connection, publicKey]);

  const updateStats = useCallback((bet: number, win: number) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        totalGames: prev.totalGames + 1,
        totalWagered: prev.totalWagered + bet,
        totalWon: prev.totalWon + win,
        biggestWin: Math.max(prev.biggestWin, win),
      };

      if (win > 0) {
        newStats.totalWins += 1;
      } else {
        newStats.totalLosses += 1;
      }

      newStats.winRate = (newStats.totalWins / newStats.totalGames) * 100;

      return newStats;
    });
  }, []);

  useEffect(() => {
    updateBalance();
    const interval = setInterval(updateBalance, 10000); // Mise à jour toutes les 10 secondes
    return () => clearInterval(interval);
  }, [updateBalance]);

  return {
    balance,
    stats,
    updateStats,
    updateBalance,
  };
}; 