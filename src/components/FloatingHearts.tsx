import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heart {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export const FloatingHearts = () => {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const createHeart = () => {
      const heart: Heart = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 50,
        size: Math.random() * 20 + 10, // Taille entre 10 et 30px
        duration: Math.random() * 3 + 2, // Durée entre 2 et 5 secondes
      };
      setHearts(prev => [...prev, heart]);
    };

    // Créer un cœur toutes les 300ms
    const interval = setInterval(createHeart, 300);

    // Nettoyer les cœurs qui sont sortis de l'écran
    const cleanupInterval = setInterval(() => {
      setHearts(prev => prev.filter(heart => heart.y > -50));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ 
              x: heart.x, 
              y: heart.y,
              opacity: 1,
              scale: 0
            }}
            animate={{ 
              y: -50,
              opacity: [1, 1, 0],
              scale: [0, 1, 1],
              rotate: [0, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: heart.duration,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <svg
              width={heart.size}
              height={heart.size}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-pink-500"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 