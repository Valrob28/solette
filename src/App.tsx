import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import Roulette from './components/Roulette';
import { useClickSound } from './hooks/useClickSound';
import { FloatingHearts } from './components/FloatingHearts';

// Import the styles
import '@solana/wallet-adapter-react-ui/styles.css';

// RPC Endpoints
const RPC_ENDPOINTS = {
  'mainnet-beta': {
    http: 'https://blue-radial-wish.solana-mainnet.quiknode.pro/d9c3b3b375c5083adbc3e91cce3b6627b0c39ba6',
    ws: 'wss://blue-radial-wish.solana-mainnet.quiknode.pro/d9c3b3b375c5083adbc3e91cce3b6627b0c39ba6'
  },
  'testnet': {
    http: 'https://api.testnet.solana.com',
    ws: 'wss://api.testnet.solana.com'
  },
  'devnet': {
    http: 'https://api.devnet.solana.com',
    ws: 'wss://api.devnet.solana.com'
  },
};

function App() {
  const playClickSound = useClickSound();

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = 'mainnet-beta' as WalletAdapterNetwork;

  // Use custom RPC endpoint for better reliability
  const endpoint = useMemo(() => {
    const endpoints = RPC_ENDPOINTS[network];
    if (endpoints) {
      return {
        http: endpoints.http,
        ws: endpoints.ws
      };
    }
    return {
      http: clusterApiUrl(network),
      ws: clusterApiUrl(network).replace('https', 'wss')
    };
  }, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint.http} config={{ wsEndpoint: endpoint.ws }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div 
            className="min-h-screen text-white"
            onClick={playClickSound}
          >
            <div className="fire-background"></div>
            <FloatingHearts />
            <div className="container mx-auto px-4 py-8 relative z-10">
              <h1 className="text-4xl font-bold text-center mb-4 animate-shine bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                MagicSpinner
              </h1>
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <p className="text-xl mb-4 text-gray-300 animate-shine bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Experience the future of decentralized gaming with MagicSpinner - where fortune favors the bold!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:scale-105 transition-transform duration-300">
                    <p className="text-2xl font-bold text-solana-green mb-2 animate-pulse">0.3 SOL</p>
                    <p className="text-sm text-gray-400">Maximum Win</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:scale-105 transition-transform duration-300">
                    <p className="text-2xl font-bold text-solana-purple mb-2 animate-pulse">5x</p>
                    <p className="text-sm text-gray-400">Spins per Round</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg hover:scale-105 transition-transform duration-300">
                    <p className="text-2xl font-bold text-orange-500 mb-2 animate-pulse">1.5 SOL</p>
                    <p className="text-sm text-gray-400">Potential Total Win</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-400 italic animate-shine bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Join the revolution of transparent, fair, and exciting crypto gaming. Your next spin could be legendary!
                </p>
              </div>
              <Roulette />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App; 