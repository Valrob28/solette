import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTransactionRetry } from '../hooks/useTransactionRetry';
import { TransactionStatus } from './TransactionStatus';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { usePayout } from '../hooks/usePayout';
import { useGameStats } from '../hooks/useGameStats';
import { GameStats } from './GameStats';
import { motion, AnimatePresence } from 'framer-motion';
import { WinAnimation } from './WinAnimation';
import { LoseAnimation } from './LoseAnimation';
import { useSound } from '../hooks/useSound';
import { PendingPayouts } from './PendingPayouts';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { MusicPlayer } from './MusicPlayer';

const segments = [
  { label: '0.1 SOL', color: '#14F195', isGain: true, amount: 0.1 },
  { label: '0.05 SOL', color: '#9945FF', isGain: true, amount: 0.05 },
  { label: 'Essaye encore', color: '#14F195', isGain: false, amount: 0 },
  { label: '0.01 SOL', color: '#9945FF', isGain: false, amount: 0 },
  { label: 'Rien', color: '#14F195', isGain: false, amount: 0 },
  { label: '0.02 SOL', color: '#9945FF', isGain: true, amount: 0.02 },
  { label: 'Perdu', color: '#14F195', isGain: false, amount: 0 },
  { label: '0.03 SOL', color: '#9945FF', isGain: true, amount: 0.03 },
];

const RADIUS = 160;
const CENTER = 170;
const SEG_ANGLE = 360 / segments.length;
const ANIMATION_DURATION = 10000; // 10 secondes
const PARTICIPATION_COST = 0.01;
const HOUSE_WALLET = new PublicKey('J9jajCmn8JRbF2E2Je5HPLJgjExFyf6Zf93B2CE146wV');

const getRotationForIndex = (index: number) => {
  return 360 * 10 - index * SEG_ANGLE - SEG_ANGLE / 2;
};

const getRandomIndexWithProbability = () => {
  // 1 chance sur 5 de tomber sur un segment gagnant
  const gainSegments = segments.map((s, i) => s.isGain ? i : null).filter(i => i !== null) as number[];
  const loseSegments = segments.map((s, i) => !s.isGain ? i : null).filter(i => i !== null) as number[];
  if (Math.random() < 0.2) {
    // Gagnant
    const idx = Math.floor(Math.random() * gainSegments.length);
    return gainSegments[idx];
  } else {
    // Perdant
    const idx = Math.floor(Math.random() * loseSegments.length);
    return loseSegments[idx];
  }
};

export const Roulette = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { sendTransactionWithRetry } = useTransactionRetry(connection);
  const { createPayoutTransaction, getPendingPayouts, updatePayoutStatus, pendingPayouts } = usePayout(connection);
  const { balance, stats, updateStats } = useGameStats(connection);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultIndex, setResultIndex] = useState<number|null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameBalance, setGameBalance] = useState(0); // Solde gagné
  const [replayed, setReplayed] = useState(0); // Solde rejoué
  const [resetKey, setResetKey] = useState(0); // Pour forcer le refresh SVG
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState<string>('');
  const [txSignature, setTxSignature] = useState<string>('');
  const [showStats, setShowStats] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const { playWin, playLose, playSpin } = useSound();
  const { isPlaying, volume, togglePlay, setMusicVolume, error } = useBackgroundMusic();

  // Solde à claim = gains cumulés - rejoué
  const claimable = Math.max(0, gameBalance - replayed);

  const startSpin = () => {
    setIsSpinning(true);
    playSpin();
    setResetKey(k => k + 1);
    setRotation(0);
    setTimeout(() => {
      const randomIndex = getRandomIndexWithProbability();
      setResultIndex(randomIndex);
      const targetRotation = getRotationForIndex(randomIndex);
      setRotation(targetRotation);
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
      }, ANIMATION_DURATION);
    }, 50);
  };

  const handleSpinClick = async () => {
    if (!connected || isSpinning || !publicKey) return;
    if (balance < PARTICIPATION_COST) {
      setTxStatus('error');
      setTxMessage('Solde insuffisant pour jouer');
      return;
    }

    try {
      setTxStatus('pending');
      setTxMessage('Envoi de la transaction...');

      // Créer la transaction avec un message descriptif
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: HOUSE_WALLET,
          lamports: PARTICIPATION_COST * 1e9,
        })
      );

      // Ajouter des métadonnées pour plus de transparence
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      setTxMessage(`Envoi de ${PARTICIPATION_COST} SOL pour participer à la roulette...`);

      const { signature } = await sendTransactionWithRetry(transaction, [], {
        maxRetries: 3,
        delayMs: 1000,
      });

      // Attendre la confirmation de la transaction
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('La transaction a été rejetée');
      }

      setTxStatus('success');
      setTxMessage(`Transaction réussie! Vous avez envoyé ${PARTICIPATION_COST} SOL pour participer.`);
      setTxSignature(signature);

      startSpin();
    } catch (error) {
      console.error('Erreur de transaction:', error);
      setTxStatus('error');
      setTxMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  const handleReplay = () => {
    setShowResult(false);
    if (resultIndex !== null && segments[resultIndex].isGain && segments[resultIndex].amount > 0) {
      setGameBalance(b => b - segments[resultIndex].amount);
      setReplayed(r => r + segments[resultIndex].amount);
    } else {
      setReplayed(r => r + PARTICIPATION_COST);
    }
    setTimeout(() => {
      startSpin();
    }, 200);
  };

  const handleClaim = () => {
    setShowResult(false);
    if (resultIndex !== null && segments[resultIndex].isGain && segments[resultIndex].amount > 0) {
      setGameBalance(b => b + segments[resultIndex].amount);
    }
    setResultIndex(null);
  };

  const handleSpinEnd = async (winningIndex: number) => {
    const segment = segments[winningIndex];
    const winAmount = segment.isGain ? segment.amount : 0;
    
    updateStats(PARTICIPATION_COST, winAmount);
    
    if (segment.isGain && segment.amount > 0) {
      try {
        setTxStatus('pending');
        setTxMessage('Création de la transaction de gain...');
        
        const payoutId = await createPayoutTransaction(segment.amount);
        
        setTxStatus('success');
        setTxMessage(`Félicitations! Vous avez gagné ${segment.amount} SOL! La transaction est en attente de signature.`);
        
        // Afficher l'animation de gain
        setWinAmount(segment.amount);
        setShowWinAnimation(true);
        playWin();
        setTimeout(() => setShowWinAnimation(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la création de la transaction:', error);
        setTxStatus('error');
        setTxMessage(error instanceof Error ? error.message : 'Erreur lors de la création de la transaction');
      }
    } else {
      setTxStatus('idle');
      setTxMessage('');
      setTxSignature('');
      
      // Afficher l'animation de perte
      setShowLoseAnimation(true);
      playLose();
      setTimeout(() => setShowLoseAnimation(false), 2000);
    }
  };

  const handleSignTransaction = async (transaction: Transaction) => {
    // Cette fonction sera appelée par le composant PendingPayouts
    // Vous devrez implémenter la logique de signature ici
    // Par exemple, en utilisant votre wallet ou un autre système de signature
    console.log('Transaction à signer:', transaction);
  };

  // Démarrer la musique après une interaction utilisateur
  const handleFirstInteraction = useCallback(() => {
    if (!isPlaying) {
      togglePlay();
    }
  }, [isPlaying, togglePlay]);

  return (
    <div className="flex flex-col items-center space-y-8" onClick={handleFirstInteraction}>
      <MusicPlayer
        isPlaying={isPlaying}
        volume={volume}
        onTogglePlay={togglePlay}
        onVolumeChange={setMusicVolume}
        error={error}
      />
      <WinAnimation amount={winAmount} isVisible={showWinAnimation} />
      <LoseAnimation isVisible={showLoseAnimation} />
      <PendingPayouts
        payouts={getPendingPayouts()}
        onSignTransaction={handleSignTransaction}
        onUpdateStatus={updatePayoutStatus}
      />
      <div className="flex flex-col items-center space-y-4">
        <WalletMultiButton className="!bg-solana-purple hover:!bg-solana-purple/80" />
        {connected && publicKey && (
          <p className="text-sm opacity-75">
            Connecté avec : {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
        )}
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition"
        >
          {showStats ? 'Masquer les stats' : 'Voir les stats'}
        </button>
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-md"
            >
              <GameStats stats={stats} balance={gameBalance} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex space-x-6 mt-2">
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Solde à claim</span>
            <span className="text-lg font-bold text-solana-green">{claimable.toFixed(2)} SOL</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Total gagné</span>
            <span className="text-lg font-bold text-solana-green">{gameBalance.toFixed(2)} SOL</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Total rejoué</span>
            <span className="text-lg font-bold text-solana-purple">{replayed.toFixed(2)} SOL</span>
          </div>
        </div>
      </div>
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Flèche */}
        <div className="absolute left-1/2 -top-8 z-20" style={{transform: 'translateX(-50%)'}}>
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-white" />
        </div>
        {/* Roulette SVG */}
        <svg
          key={resetKey}
          width={CENTER * 2}
          height={CENTER * 2}
          className="block"
          style={{
            transition: isSpinning ? `transform ${ANIMATION_DURATION/1000}s cubic-bezier(0.2, 0.8, 0.3, 1)` : 'none',
            transform: `rotate(${rotation}deg)`
          }}
        >
          {segments.map((seg, i) => {
            const startAngle = i * SEG_ANGLE - 90;
            const endAngle = (i + 1) * SEG_ANGLE - 90;
            const largeArc = SEG_ANGLE > 180 ? 1 : 0;
            const x1 = CENTER + RADIUS * Math.cos((Math.PI * startAngle) / 180);
            const y1 = CENTER + RADIUS * Math.sin((Math.PI * startAngle) / 180);
            const x2 = CENTER + RADIUS * Math.cos((Math.PI * endAngle) / 180);
            const y2 = CENTER + RADIUS * Math.sin((Math.PI * endAngle) / 180);
            return (
              <path
                key={i}
                d={`M${CENTER},${CENTER} L${x1},${y1} A${RADIUS},${RADIUS} 0 ${largeArc} 1 ${x2},${y2} Z`}
                fill={seg.color}
                stroke="#222"
                strokeWidth="2"
              />
            );
          })}
          {/* Labels */}
          {segments.map((seg, i) => {
            const angle = (i + 0.5) * SEG_ANGLE - 90;
            const x = CENTER + (RADIUS - 40) * Math.cos((Math.PI * angle) / 180);
            const y = CENTER + (RADIUS - 40) * Math.sin((Math.PI * angle) / 180);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#fff"
                fontSize="18"
                fontWeight="bold"
                transform={`rotate(${angle + 90},${x},${y})`}
                style={{
                  textShadow: '1px 1px 2px #222',
                }}
              >
                {seg.label}
              </text>
            );
          })}
          {/* Centre */}
          <circle cx={CENTER} cy={CENTER} r="40" fill="#111827" stroke="#fff" strokeWidth="4" />
        </svg>
        {/* Bouton central */}
        <button
          onClick={handleSpinClick}
          disabled={!connected || isSpinning || showResult}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all z-10
            ${!connected || isSpinning || showResult
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-solana-green hover:bg-solana-green/80 text-black'}
          `}
        >
          {isSpinning ? 'La roue tourne...' : 'Lancer (0.01 SOL)'}
        </button>
        {/* Popup de résultat */}
        {showResult && resultIndex !== null && (
          <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center z-30 bg-black bg-opacity-60">
            <div className="bg-gray-900 rounded-xl p-8 shadow-lg flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2">Résultat</h3>
              <p className="text-lg mb-4">
                {segments[resultIndex].isGain
                  ? <>🎉 Tu as gagné <span className="text-solana-green font-bold">{segments[resultIndex].amount} SOL</span> !</>
                  : <>Dommage, tu n'as rien gagné cette fois.</>
                }
              </p>
              <div className="flex space-x-4">
                {segments[resultIndex].isGain && segments[resultIndex].amount > 0 && (
                  <button
                    onClick={handleClaim}
                    className="px-6 py-2 rounded bg-solana-green text-black font-bold hover:bg-solana-green/80 transition"
                  >Claim</button>
                )}
                <button
                  onClick={handleReplay}
                  className="px-6 py-2 rounded bg-solana-purple text-white font-bold hover:bg-solana-purple/80 transition"
                >Rejouer la mise</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <TransactionStatus
        status={txStatus}
        message={txMessage}
        signature={txSignature}
      />
    </div>
  );
};

export default Roulette; 