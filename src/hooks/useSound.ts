import { useCallback, useRef } from 'react';

interface SoundEffects {
  playWin: () => void;
  playLose: () => void;
  playSpin: () => void;
}

export const useSound = (): SoundEffects => {
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);
  const spinSound = useRef<HTMLAudioElement | null>(null);

  const playWin = useCallback(() => {
    if (!winSound.current) {
      winSound.current = new Audio('/sounds/win.mp3');
    }
    winSound.current.currentTime = 0;
    winSound.current.play().catch(console.error);
  }, []);

  const playLose = useCallback(() => {
    if (!loseSound.current) {
      loseSound.current = new Audio('/sounds/lose.mp3');
    }
    loseSound.current.currentTime = 0;
    loseSound.current.play().catch(console.error);
  }, []);

  const playSpin = useCallback(() => {
    if (!spinSound.current) {
      spinSound.current = new Audio('/sounds/spin.mp3');
    }
    spinSound.current.currentTime = 0;
    spinSound.current.play().catch(console.error);
  }, []);

  return { playWin, playLose, playSpin };
}; 