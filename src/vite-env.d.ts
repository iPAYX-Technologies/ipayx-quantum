/// <reference types="vite/client" />

// MetaMask & Hedera Snap types
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}

// Hedera Snap response types
interface HederaAccountInfo {
  accountId: string;
  balance?: string;
}

interface HederaTransaction {
  transactionId: string;
  status?: string;
}

