// Configuration de l'URL du backend Python (à remplacer par ton URL réelle)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';

export const api = {
  // Obtenir un quote de route optimale
  getQuote: async (params: {
    from: string;
    to: string;
    amount: number;
    asset?: string;
  }) => {
    const response = await fetch(`${BACKEND_URL}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  // Connecter un wallet (MetaMask universel - supporte EVM + Tron via Snap)
  connectWallet: async (params: {
    address: string;
    chain: 'ethereum' | 'tron' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
    provider: 'metamask';
  }) => {
    const response = await fetch(`${BACKEND_URL}/api/wallet/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  // Obtenir les taux FX en temps réel
  getFXRates: async (base: string, target: string) => {
    const response = await fetch(`${BACKEND_URL}/api/rates?base=${base}&target=${target}`);
    return response.json();
  },

  // Calculer le ROI (utilisé par le ROI Calculator)
  calculateROI: async (params: {
    amount: number;
    transitDays: number;
    interestRate: string;
    supplierWaiting: string;
  }) => {
    const response = await fetch(`${BACKEND_URL}/api/calculate-roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },
};
