import { useEffect, useRef } from 'react';

export const useClickSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/pokemon-win.mp3');
    audioRef.current.volume = 0.5; // Réduire le volume à 50%
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Réinitialiser le son
      audioRef.current.play().catch(error => {
        console.log('Erreur lors de la lecture du son:', error);
      });
    }
  };

  return playSound;
}; 