import React, { useState } from 'react';

interface TokenTrackerProps {
  defaultToken?: string;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({ defaultToken = 'SOL/USDC' }) => {
  const [token, setToken] = useState(defaultToken);

  return (
    <div className="fixed left-4 top-4 w-80 bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="mb-4">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Entrez une paire (ex: SOL/USDC)"
          className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-solana-purple"
        />
      </div>
      <div className="w-full h-[400px]">
        <iframe
          src={`https://dexscreener.com/embed/solana/${token}`}
          title="DexScreener Widget"
          className="w-full h-full rounded-lg"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}; 