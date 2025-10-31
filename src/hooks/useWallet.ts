import { useState, useEffect } from 'react';
import { hederaWalletService } from '../services/hedera-wallet.service';
import type { WalletConnection } from '../services/hedera-wallet.service';

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing connection
    const existingConnection = hederaWalletService.getConnection();
    if (existingConnection) {
      setConnection(existingConnection);
    }
  }, []);

  const connectHashPack = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const conn = await hederaWalletService.connectHashPack();
      setConnection(conn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const conn = await hederaWalletService.connectMetaMaskSnap();
      setConnection(conn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    hederaWalletService.disconnect();
    setConnection(null);
    setError(null);
  };

  return {
    connection,
    isConnecting,
    error,
    isConnected: !!connection,
    connectHashPack,
    connectMetaMask,
    disconnect,
    hasHashPack: hederaWalletService.isHashPackAvailable(),
    hasMetaMask: hederaWalletService.isMetaMaskAvailable(),
  };
}
