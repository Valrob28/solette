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
import { TokenTracker } from './TokenTracker';

const segments = [
  { label: '0.1 SOL', color: '#14F195', isGain: true, amount: 0.1 },
  { label: '0.2 SOL', color: '#9945FF', isGain: true, amount: 0.2 },
  { label: '0.3 SOL', color: '#14F195', isGain: true, amount: 0.3 },
  { label: 'Try again', color: '#9945FF', isGain: false, amount: 0 },
  { label: 'Nothing', color: '#14F195', isGain: false, amount: 0 },
  { label: 'Lost', color: '#9945FF', isGain: false, amount: 0 },
  { label: 'Too bad', color: '#14F195', isGain: false, amount: 0 },
  { label: 'Try again', color: '#9945FF', isGain: false, amount: 0 },
];

const RADIUS = 160;
const CENTER = 170;
const SEG_ANGLE = 360 / segments.length;
const ANIMATION_DURATION = 10000; // 10 secondes
const PARTICIPATION_COST = 0.01;
const MAX_SPINS = 5;
const HOUSE_WALLET = new PublicKey('J9jajCmn8JRbF2E2Je5HPLJgjExFyf6Zf93B2CE146wV');

const getRotationForIndex = (index: number) => {
  return 360 * 10 - index * SEG_ANGLE - SEG_ANGLE / 2;
};

const getRandomIndexWithProbability = () => {
  // Probabilité de gain mise à 0%
  const loseSegments = segments.map((s, i) => !s.isGain ? i : null).filter(i => i !== null) as number[];
  // Retourne toujours un segment perdant
  const idx = Math.floor(Math.random() * loseSegments.length);
  return loseSegments[idx];
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
  const [spinCount, setSpinCount] = useState(0);
  const [selectedSpins, setSelectedSpins] = useState(1);
  const [isMaxSpinsReached, setIsMaxSpinsReached] = useState(false);

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
    const totalCost = PARTICIPATION_COST * selectedSpins;
    
    if (balance < totalCost) {
      setTxStatus('error');
      setTxMessage(`Insufficient balance to play ${selectedSpins} spins (${totalCost} SOL needed)`);
      return;
    }
    if (spinCount + selectedSpins > MAX_SPINS) {
      setTxStatus('error');
      setTxMessage(`Cannot play ${selectedSpins} spins. Only ${MAX_SPINS - spinCount} spins remaining.`);
      return;
    }

    try {
      setTxStatus('pending');
      setTxMessage(`Preparing transaction of ${totalCost} SOL...`);

      const transaction = new Transaction();
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: HOUSE_WALLET,
          lamports: Math.floor(totalCost * 1e9),
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const { signature } = await sendTransactionWithRetry(transaction, [], {
        maxRetries: 3,
        delayMs: 1000,
      });

      setTxMessage('Waiting for confirmation...');

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction rejected');
      }

      setTxStatus('success');
      setTxMessage(`Transaction confirmed! You sent ${totalCost} SOL.`);
      setTxSignature(signature);

      // Mettre à jour les statistiques avant de lancer les spins
      setReplayed(prev => prev + totalCost);
      setSpinCount(prev => prev + selectedSpins);
      if (spinCount + selectedSpins >= MAX_SPINS) {
        setIsMaxSpinsReached(true);
      }

      startSpin();
    } catch (error) {
      console.error('Transaction error:', error);
      setTxStatus('error');
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          setTxMessage('Transaction cancelled by user');
        } else {
          setTxMessage(`Error: ${error.message}`);
        }
      } else {
        setTxMessage('Unknown error during transaction');
      }
    }
  };

  const handleReplay = () => {
    setShowResult(false);
    if (resultIndex !== null && segments[resultIndex].isGain && segments[resultIndex].amount > 0) {
      setGameBalance(b => b - segments[resultIndex].amount);
      setReplayed(r => r + segments[resultIndex].amount);
    } else {
      setReplayed(r => r + PARTICIPATION_COST * selectedSpins);
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
    const winAmount = segment.isGain ? segment.amount * selectedSpins : 0;
    
    updateStats(PARTICIPATION_COST * selectedSpins, winAmount);
    
    if (segment.isGain && segment.amount > 0) {
      try {
        setTxStatus('pending');
        setTxMessage('Creating winning transaction...');
        
        const payoutId = await createPayoutTransaction(winAmount);
        
        setTxStatus('success');
        setTxMessage(`Congratulations! You won ${winAmount} SOL! Transaction is pending signature.`);
        
        setWinAmount(winAmount);
        setShowWinAnimation(true);
        playWin();
        setTimeout(() => setShowWinAnimation(false), 2000);
      } catch (error) {
        console.error('Error creating transaction:', error);
        setTxStatus('error');
        setTxMessage(error instanceof Error ? error.message : 'Error creating transaction');
      }
    } else {
      setTxStatus('idle');
      setTxMessage('');
      setTxSignature('');
      
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
      <TokenTracker />
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
      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <WalletMultiButton className="!bg-solana-purple hover:!bg-solana-purple/80" />
        {connected && publicKey && (
          <p className="text-sm opacity-75">
            Connected with: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </p>
        )}
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition"
        >
          {showStats ? 'Hide stats' : 'Show stats'}
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
        <div className="w-full px-4">
          <label htmlFor="spins" className="block text-sm font-medium text-gray-300 mb-2">
            Number of spins: {selectedSpins}
          </label>
          <input
            type="range"
            id="spins"
            min="1"
            max={MAX_SPINS - spinCount}
            value={selectedSpins}
            onChange={(e) => setSelectedSpins(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            disabled={isMaxSpinsReached}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>{MAX_SPINS - spinCount}</span>
          </div>
        </div>
        <div className="flex space-x-6 mt-2">
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Spins remaining</span>
            <span className="text-lg font-bold text-solana-purple">{MAX_SPINS - spinCount}</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Total cost</span>
            <span className="text-lg font-bold text-solana-purple">{(PARTICIPATION_COST * selectedSpins).toFixed(2)} SOL</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Claimable balance</span>
            <span className="text-lg font-bold text-solana-green">{claimable.toFixed(2)} SOL</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Total won</span>
            <span className="text-lg font-bold text-solana-green">{gameBalance.toFixed(2)} SOL</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-gray-400">Total replayed</span>
            <span className="text-lg font-bold text-solana-purple">{replayed.toFixed(2)} SOL</span>
          </div>
        </div>
      </div>
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Arrow */}
        <div className="absolute left-1/2 -top-8 z-20" style={{transform: 'translateX(-50%)'}}>
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-white" />
        </div>
        {/* Wheel SVG */}
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
        {/* Center button */}
        <button
          onClick={handleSpinClick}
          disabled={!connected || isSpinning || showResult || isMaxSpinsReached}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all z-10
            ${!connected || isSpinning || showResult || isMaxSpinsReached
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-solana-green hover:bg-solana-green/80 text-black'}
          `}
        >
          {isSpinning ? 'Wheel is spinning...' : 
           isMaxSpinsReached ? 'Maximum spins reached' :
           `Spin ${selectedSpins}x (${MAX_SPINS - spinCount} remaining) - ${(PARTICIPATION_COST * selectedSpins).toFixed(2)} SOL`}
        </button>
        {/* Result popup */}
        {showResult && resultIndex !== null && (
          <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center z-30 bg-black bg-opacity-60">
            <div className="bg-gray-900 rounded-xl p-8 shadow-lg flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-2">Result</h3>
              <p className="text-lg mb-4">
                {segments[resultIndex].isGain
                  ? <>🎉 You won <span className="text-solana-green font-bold">{segments[resultIndex].amount} SOL</span>!</>
                  : <>Too bad, you didn't win this time.</>
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
                >Replay bet</button>
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