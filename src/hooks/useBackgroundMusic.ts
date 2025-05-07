import { useCallback, useRef, useState, useEffect } from 'react';

export const useBackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser l'audio une seule fois
  useEffect(() => {
    if (!isInitialized) {
      try {
        const audio = new Audio();
        audio.src = '/sounds/background-music.mp3';
        audio.loop = true;
        audio.volume = volume;
        
        // Ajouter des gestionnaires d'événements pour le débogage
        audio.addEventListener('error', (e) => {
          console.error('Erreur audio:', e);
          setError(`Erreur de chargement audio: ${audio.error?.message || 'Erreur inconnue'}`);
        });

        audio.addEventListener('canplaythrough', () => {
          console.log('Audio prêt à être joué');
          setError(null);
        });

        audioRef.current = audio;
        setIsInitialized(true);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de l\'audio:', err);
        setError('Erreur lors de l\'initialisation de l\'audio');
      }
    }
  }, [isInitialized, volume]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        console.log('Tentative de lecture audio...');
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      } catch (error) {
        console.error('Erreur lors de la lecture:', error);
        setError('Erreur lors de la lecture. Cliquez n\'importe où sur la page pour activer la musique.');
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        setIsPlaying(false);
        setError(null);
      } catch (error) {
        console.error('Erreur lors de la pause:', error);
        setError('Erreur lors de la pause');
      }
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
    setMusicVolume,
    error
  };
}; 