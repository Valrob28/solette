import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinAnimationProps {
  amount: number;
  isVisible: boolean;
}

export const WinAnimation: React.FC<WinAnimationProps> = ({ amount, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -100 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-6xl font-bold text-solana-green"
          >
            +{amount} SOL
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="absolute text-4xl"
          >
            🎉
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 