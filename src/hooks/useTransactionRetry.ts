import { useCallback } from 'react';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
}

export const useTransactionRetry = (connection: Connection) => {
  const { publicKey, signTransaction } = useWallet();

  const sendTransactionWithRetry = useCallback(
    async (
      transaction: Transaction,
      signers: any[] = [],
      config: RetryConfig = {}
    ) => {
      const { maxRetries = 3, delayMs = 1000 } = config;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Ajouter les signataires
          if (signers.length > 0) {
            transaction.partialSign(...signers);
          }

          // Signer la transaction si un wallet est connecté
          if (publicKey && signTransaction) {
            const signedTx = await signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            
            // Attendre la confirmation
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            
            if (confirmation.value.err) {
              throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            return { signature, confirmation };
          } else {
            throw new Error('Wallet not connected');
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`Transaction attempt ${attempt + 1} failed:`, error);
          
          // Attendre avant de réessayer
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
          }
        }
      }

      throw new Error(`Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    },
    [connection, publicKey, signTransaction]
  );

  return { sendTransactionWithRetry };
}; 