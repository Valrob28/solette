import React, { useState } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface TokenTrackerProps {
  defaultToken?: string;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({ defaultToken = 'SOL/USDC' }) => {
  const [token, setToken] = useState(defaultToken);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(`https://dexscreener.com/solana/${token}`, '_blank');
  };

  return (
    <div className="fixed left-4 top-4 w-80 bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Suivi de Token</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={token}
            onChange={handleTokenChange}
            placeholder="Entrez une paire (ex: SOL/USDC)"
            className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple"
          />
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-solana-purple hover:bg-solana-purple/80 text-white rounded-lg transition-colors"
        >
          <span>Voir sur DexScreener</span>
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </button>
      </form>
      <div className="mt-4 text-sm text-gray-400">
        <p>Exemples de paires :</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>SOL/USDC</li>
          <li>BONK/SOL</li>
          <li>RAY/USDC</li>
          <li>JUP/SOL</li>
        </ul>
      </div>
    </div>
  );
}; 