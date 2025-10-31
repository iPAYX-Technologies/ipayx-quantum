/**
 * Backend API Wrapper
 * Connects to existing Python backend at https://api.ipayx-protocol.com
 * Handles Hedera, Chainlink, and other iPAYX V4 backend services
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';

interface ChainlinkPriceResponse {
  asset: string;
  price: number;
  timestamp: number;
  source: string;
}

interface HederaBalanceResponse {
  accountId: string;
  balance: number;
  tokenBalances?: Array<{
    tokenId: string;
    balance: number;
  }>;
}

interface HederaTransactionRequest {
  from: string;
  to: string;
  amount: number;
  tokenId?: string;
}

interface HederaTransactionResponse {
  transactionId: string;
  status: string;
  timestamp: number;
}

/**
 * Backend API Service
 * Wraps all calls to the existing Python backend
 */
export const backendAPI = {
  /**
   * Chainlink Oracle - Get asset price
   */
  chainlink: {
    getPrice: async (asset: string): Promise<ChainlinkPriceResponse> => {
      const response = await fetch(`${BACKEND_URL}/oracles/chainlink/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset })
      });
      
      if (!response.ok) {
        throw new Error(`Chainlink API error: ${response.statusText}`);
      }
      
      return response.json();
    }
  },

  /**
   * Hedera Network - Balance and transactions
   */
  hedera: {
    getBalance: async (accountId: string): Promise<HederaBalanceResponse> => {
      const response = await fetch(`${BACKEND_URL}/hedera/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      
      if (!response.ok) {
        throw new Error(`Hedera API error: ${response.statusText}`);
      }
      
      return response.json();
    },

    sendTransaction: async (txRequest: HederaTransactionRequest): Promise<HederaTransactionResponse> => {
      const response = await fetch(`${BACKEND_URL}/hedera/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txRequest)
      });
      
      if (!response.ok) {
        throw new Error(`Hedera transaction error: ${response.statusText}`);
      }
      
      return response.json();
    }
  },

  /**
   * Meta-Router - Get optimal route for cross-chain transfer
   */
  metaRouter: {
    getRoute: async (params: {
      fromNetwork: string;
      toNetwork: string;
      asset: string;
      amount: number;
    }) => {
      const response = await fetch(`${BACKEND_URL}/meta-router/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Meta-router API error: ${response.statusText}`);
      }
      
      return response.json();
    }
  },

  /**
   * Eliza AI Orchestrator - Intelligent multi-chain routing
   */
  eliza: {
    orchestrate: async (params: {
      fromNetwork: string;
      toNetwork: string;
      asset: string;
      amount: number;
    }) => {
      const response = await fetch(`${BACKEND_URL}/eliza/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Eliza API error: ${response.statusText}`);
      }
      
      return response.json();
    }
  }
};
