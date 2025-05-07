import React from 'react';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  signature?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  message,
  signature
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <span className="text-xl">{getStatusIcon()}</span>
        <div>
          <p className={`font-semibold ${getStatusColor()}`}>
            {status === 'pending' && 'Transaction en cours...'}
            {status === 'success' && 'Transaction réussie!'}
            {status === 'error' && 'Erreur de transaction'}
          </p>
          {message && <p className="text-sm text-gray-400">{message}</p>}
          {signature && (
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Voir sur Solscan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}; 