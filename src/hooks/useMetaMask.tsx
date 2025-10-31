import { useState, useEffect } from 'react';

interface MetaMaskState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isInstalled: boolean;
  hederaAccount: string | null;
  isHederaConnected: boolean;
}

const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', rpc: 'https://eth.llamarpc.com' },
  137: { name: 'Polygon', rpc: 'https://polygon-rpc.com' },
  42161: { name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
  10: { name: 'Optimism', rpc: 'https://mainnet.optimism.io' },
  8453: { name: 'Base', rpc: 'https://mainnet.base.org' }
};

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    account: null,
    chainId: null,
    isConnected: false,
    isInstalled: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
    hederaAccount: null,
    isHederaConnected: false
  });

  useEffect(() => {
    if (!state.isInstalled) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState(prev => ({ ...prev, account: null, isConnected: false }));
      } else {
        setState(prev => ({ ...prev, account: accounts[0], isConnected: true }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(prev => ({ ...prev, chainId }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.isInstalled]);

  const connect = async () => {
    if (!state.isInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      throw new Error('MetaMask not installed');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      const chainId = parseInt(chainIdHex, 16);

      setState({
        account: accounts[0],
        chainId,
        isConnected: true,
        isInstalled: true,
        hederaAccount: null,
        isHederaConnected: false
      });

      return { account: accounts[0], chainId };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      throw new Error(error.message || 'Failed to connect MetaMask');
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!state.isInstalled) {
      throw new Error('MetaMask not installed');
    }

    const chainIdHex = `0x${targetChainId.toString(16)}`;
    const chain = SUPPORTED_CHAINS[targetChainId as keyof typeof SUPPORTED_CHAINS];

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added, try adding it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: chain.name,
              rpcUrls: [chain.rpc],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              }
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw switchError;
      }
    }
  };

  const connectHedera = async () => {
    if (!state.isInstalled) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Install Hedera Wallet Snap
      await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
          'npm:@hashgraph/hedera-wallet-snap': {}
        }
      });

      // Get Hedera account info
      const hederaAccount = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@hashgraph/hedera-wallet-snap',
          request: { method: 'hedera_getAccountInfo' }
        }
      });

      setState(prev => ({
        ...prev,
        hederaAccount: hederaAccount.accountId,
        isHederaConnected: true
      }));

      return { accountId: hederaAccount.accountId };
    } catch (error: any) {
      console.error('Hedera Snap connection error:', error);
      throw new Error(error.message || 'Failed to connect Hedera Snap');
    }
  };

  const sendHederaTransaction = async (params: {
    to: string;
    amount: string;
    memo?: string;
  }) => {
    if (!state.isHederaConnected) {
      throw new Error('Hedera not connected');
    }

    try {
      const result = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@hashgraph/hedera-wallet-snap',
          request: {
            method: 'hedera_transferHBAR',
            params: {
              to: params.to,
              amount: params.amount,
              memo: params.memo || ''
            }
          }
        }
      });

      return result;
    } catch (error: any) {
      console.error('Hedera transaction error:', error);
      throw new Error(error.message || 'Failed to send Hedera transaction');
    }
  };

  const disconnect = () => {
    setState({
      account: null,
      chainId: null,
      isConnected: false,
      isInstalled: state.isInstalled,
      hederaAccount: null,
      isHederaConnected: false
    });
  };

  return {
    ...state,
    connect,
    connectHedera,
    sendHederaTransaction,
    switchNetwork,
    disconnect,
    supportedChains: SUPPORTED_CHAINS
  };
}
