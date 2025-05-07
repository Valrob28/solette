import React from 'react';
import { motion } from 'framer-motion';

interface MusicPlayerProps {
  isPlaying: boolean;
  volume: number;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  isPlaying,
  volume,
  onTogglePlay,
  onVolumeChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 bg-gray-800 rounded-lg p-3 shadow-lg flex items-center space-x-3"
    >
      <button
        onClick={onTogglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-solana-purple hover:bg-solana-purple/80 transition"
      >
        {isPlaying ? (
          <span className="text-white">⏸</span>
        ) : (
          <span className="text-white">▶</span>
        )}
      </button>
      <div className="flex items-center space-x-2">
        <span className="text-white text-sm">🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24"
        />
        <span className="text-white text-sm">🔊</span>
      </div>
    </motion.div>
  );
}; 