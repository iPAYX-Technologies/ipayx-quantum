// Hedera Wallet Integration Service
// Supports HashPack and MetaMask Snap

export interface WalletConnection {
  accountId: string;
  network: string;
  provider: 'hashpack' | 'metamask-snap' | null;
}

export class HederaWalletService {
  private connection: WalletConnection | null = null;

  // Check if HashPack is available
  isHashPackAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as Window & { hashpack?: unknown }).hashpack;
  }

  // Check if MetaMask is available
  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as Window & { ethereum?: unknown }).ethereum;
  }

  // Connect to HashPack
  async connectHashPack(): Promise<WalletConnection> {
    if (!this.isHashPackAvailable()) {
      throw new Error('HashPack wallet not found. Please install HashPack extension.');
    }

    try {
      const hashpack = ((window as unknown) as { hashpack: {
        init: (metadata: { name: string; description: string; icon: string }) => Promise<{
          pairingData?: { accountIds: string[]; network: string }
        }>
      }}).hashpack;
      const appMetadata = {
        name: 'iPayX Quantum',
        description: 'AI-Ready Payment Infrastructure',
        icon: window.location.origin + '/favicon.ico',
      };

      const initData = await hashpack.init(appMetadata);
      
      if (initData.pairingData) {
        const accountId = initData.pairingData.accountIds[0];
        const network = initData.pairingData.network;

        this.connection = {
          accountId,
          network,
          provider: 'hashpack',
        };

        return this.connection;
      }

      throw new Error('Failed to connect to HashPack');
    } catch (error) {
      console.error('HashPack connection error:', error);
      throw error;
    }
  }

  // Connect to MetaMask Snap
  async connectMetaMaskSnap(): Promise<WalletConnection> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    try {
      const ethereum = ((window as unknown) as { ethereum: {
        request: (params: { method: string; params?: Record<string, unknown> }) => Promise<{ accountId?: string }>
      }}).ethereum;
      
      // Request Hedera Snap
      const snapId = 'npm:@hashgraph/hedera-wallet-snap';
      await ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: {},
        },
      });

      // Get account info from snap
      const response = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'getAccountInfo',
          },
        },
      });

      if (response?.accountId) {
        this.connection = {
          accountId: response.accountId,
          network: import.meta.env.VITE_HEDERA_NETWORK || 'testnet',
          provider: 'metamask-snap',
        };

        return this.connection;
      }

      throw new Error('Failed to get account info from MetaMask Snap');
    } catch (error) {
      console.error('MetaMask Snap connection error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.connection = null;
  }

  // Get current connection
  getConnection(): WalletConnection | null {
    return this.connection;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connection !== null;
  }
}

// Export singleton instance
export const hederaWalletService = new HederaWalletService();
