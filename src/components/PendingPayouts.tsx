import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface PendingPayout {
  id: string;
  amount: number;
  toAddress: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

interface PendingPayoutsProps {
  payouts: PendingPayout[];
  onSignTransaction: (transaction: Transaction) => Promise<void>;
  onUpdateStatus: (id: string, status: 'completed' | 'failed') => void;
}

export const PendingPayouts: React.FC<PendingPayoutsProps> = ({
  payouts,
  onSignTransaction,
  onUpdateStatus
}) => {
  const handleSign = async (payout: PendingPayout) => {
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey('J9jajCmn8JRbF2E2Je5HPLJgjExFyf6Zf93B2CE146wV'),
          toPubkey: new PublicKey(payout.toAddress),
          lamports: payout.amount * 1e9,
        })
      );

      await onSignTransaction(transaction);
      onUpdateStatus(payout.id, 'completed');
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      onUpdateStatus(payout.id, 'failed');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {payouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-800 rounded-lg p-4 shadow-lg"
          >
            <h3 className="text-lg font-bold text-white mb-2">Paiements en attente</h3>
            <div className="space-y-2">
              {payouts.map(payout => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-700 rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white">
                      {payout.amount} SOL → {payout.toAddress.slice(0, 4)}...{payout.toAddress.slice(-4)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(payout.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSign(payout)}
                    className="px-3 py-1 bg-solana-green text-black rounded hover:bg-solana-green/80 transition"
                  >
                    Signer
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 