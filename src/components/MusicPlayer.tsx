import React from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface MusicPlayerProps {
  isPlaying: boolean;
  volume: number;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
  error?: string | null;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  isPlaying,
  volume,
  onTogglePlay,
  onVolumeChange,
  error
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
      <button
        onClick={onTogglePlay}
        className="text-white hover:text-solana-green transition-colors"
      >
        {isPlaying ? (
          <PauseIcon className="h-6 w-6" />
        ) : (
          <PlayIcon className="h-6 w-6" />
        )}
      </button>
      
      <div className="flex items-center space-x-2">
        {volume === 0 ? (
          <SpeakerXMarkIcon className="h-5 w-5 text-white" />
        ) : (
          <SpeakerWaveIcon className="h-5 w-5 text-white" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm ml-4">
          {error}
        </div>
      )}
    </div>
  );
}; 