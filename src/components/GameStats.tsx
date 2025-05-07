import React from 'react';
import { motion } from 'framer-motion';

interface GameStatsProps {
  stats: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalWagered: number;
    totalWon: number;
    biggestWin: number;
    winRate: number;
  };
  balance: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ stats, balance }) => {
  const statsItems = [
    { label: 'Parties jouées', value: stats.totalGames },
    { label: 'Victoires', value: stats.totalWins },
    { label: 'Défaites', value: stats.totalLosses },
    { label: 'Misé au total', value: `${stats.totalWagered.toFixed(2)} SOL` },
    { label: 'Gagné au total', value: `${stats.totalWon.toFixed(2)} SOL` },
    { label: 'Plus gros gain', value: `${stats.biggestWin.toFixed(2)} SOL` },
    { label: 'Taux de victoire', value: `${stats.winRate.toFixed(1)}%` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4 text-white">Statistiques</h2>
      <div className="grid grid-cols-2 gap-4">
        {statsItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700 rounded p-3"
          >
            <div className="text-gray-400 text-sm">{item.label}</div>
            <div className="text-white font-bold">{item.value}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm">Solde actuel</div>
        <div className="text-white font-bold text-xl">{balance.toFixed(2)} SOL</div>
      </div>
    </motion.div>
  );
}; 