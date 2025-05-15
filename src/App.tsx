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
            <div className="absolute top-4 right-4 z-20">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="w-16 h-16 object-contain hover:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="container mx-auto px-4 py-8 relative z-10">
              <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                AncientSpinner
              </h1>
              <Roulette />
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App; 