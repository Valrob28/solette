import { useCallback, useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTransactionRetry } from './useTransactionRetry';

const HOUSE_WALLET = new PublicKey('J9jajCmn8JRbF2E2Je5HPLJgjExFyf6Zf93B2CE146wV');

interface PendingPayout {
  id: string;
  amount: number;
  toAddress: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export const usePayout = (connection: Connection) => {
  const { publicKey } = useWallet();
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);

  const createPayoutTransaction = useCallback(async (amount: number) => {
    if (!publicKey) throw new Error('Wallet non connectée');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: HOUSE_WALLET,
        toPubkey: publicKey,
        lamports: amount * 1e9,
      })
    );

    // Ajouter la transaction à la file d'attente
    const payout: PendingPayout = {
      id: Math.random().toString(36).substring(7),
      amount,
      toAddress: publicKey.toString(),
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingPayouts(prev => [...prev, payout]);

    // Retourner l'ID de la transaction en attente
    return payout.id;
  }, [publicKey]);

  const getPendingPayouts = useCallback(() => {
    return pendingPayouts.filter(p => p.status === 'pending');
  }, [pendingPayouts]);

  const updatePayoutStatus = useCallback((id: string, status: 'completed' | 'failed') => {
    setPendingPayouts(prev => 
      prev.map(p => p.id === id ? { ...p, status } : p)
    );
  }, []);

  return {
    createPayoutTransaction,
    getPendingPayouts,
    updatePayoutStatus,
    pendingPayouts
  };
}; 