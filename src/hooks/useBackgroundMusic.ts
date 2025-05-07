import { useCallback, useRef, useState, useEffect } from 'react';

export const useBackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser l'audio une seule fois
  useEffect(() => {
    if (!isInitialized) {
      audioRef.current = new Audio('/sounds/background-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      setIsInitialized(true);
    }
  }, [isInitialized, volume]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        // Sur Firefox, on doit attendre une interaction utilisateur
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Erreur lors de la lecture:', error);
        // Afficher un message à l'utilisateur pour qu'il interagisse avec la page
        alert('Cliquez n\'importe où sur la page pour activer la musique');
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setMusicVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  return {
    isPlaying,
    volume,
    play,
    pause,
    togglePlay,
    setMusicVolume
  };
}; 