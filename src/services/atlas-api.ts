// Atlas API stubs with DRY_RUN mode
// All functions return mock data when DRY_RUN is enabled

const isDryRun = () => {
  return import.meta.env.VITE_DRY_RUN !== 'false';
};

// Mock data
const mockQuotes = [
  {
    provider: 'NDAX',
    feePct: 0.20,
    spreadPct: 0.25,
    eta: '2-4 hours',
    route: 'CAD → NDAX → USDC → Circle → PKR',
    totalCost: 45.45,
    rate: 227.50
  },
  {
    provider: 'Cybrid',
    feePct: 0.15,
    spreadPct: 0.30,
    eta: '1-2 hours',
    route: 'CAD → Cybrid → USDC → Circle → PKR',
    totalCost: 44.99,
    rate: 227.75
  },
  {
    provider: 'Bank Wire',
    feePct: 2.50,
    spreadPct: 0.50,
    eta: '1-2 days',
    route: 'CAD → Wire → Bank → PKR',
    totalCost: 96.00,
    rate: 225.00
  }
];

const mockWeather = {
  location: 'Montreal, QC',
  temperature: 18,
  condition: 'Partly Cloudy',
  icon: '⛅'
};

const mockMarket = {
  cadUsd: {
    rate: 0.7234,
    change: '+0.15%',
    direction: 'up'
  },
  btcUsdc: {
    rate: 43250.00,
    change: '+2.34%',
    direction: 'up'
  }
};

const mockNews = [
  {
    title: 'USDC expands to new corridors in Asia-Pacific',
    source: 'CoinDesk',
    time: '2h ago'
  },
  {
    title: 'Cross-border payments volume up 23% in Q4',
    source: 'Bloomberg',
    time: '4h ago'
  },
  {
    title: 'Canadian banks explore stablecoin settlements',
    source: 'Financial Post',
    time: '6h ago'
  }
];

// In-memory storage for DRY_RUN demo
let memoryStore: Record<string, any> = {};

export const atlasApi = {
  // Get payment quote
  getQuote: async (params: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    toCountry: string;
  }) => {
    if (!isDryRun()) {
      // In production, this would call a real API
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      quotes: mockQuotes.map(quote => ({
        ...quote,
        amount: params.amount,
        fromCurrency: params.fromCurrency,
        toCurrency: params.toCurrency
      })),
      timestamp: new Date().toISOString()
    };
  },

  // Get weather widget data
  getWeather: async () => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      data: mockWeather
    };
  },

  // Get market widget data
  getMarket: async () => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      data: mockMarket
    };
  },

  // Get news widget data
  getNews: async () => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      data: mockNews
    };
  },

  // Smart routing memory - GET
  getMemory: async () => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    // Read from localStorage in DRY_RUN mode
    const stored = localStorage.getItem('ipayx.smartRoutes');
    if (stored) {
      memoryStore = JSON.parse(stored);
    }

    return {
      success: true,
      data: memoryStore
    };
  },

  // Smart routing memory - POST
  saveMemory: async (data: {
    recipient: string;
    country: string;
    method: string;
    amount?: number;
  }) => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    // Save to localStorage in DRY_RUN mode
    const key = `${data.country}_${data.recipient}`.toLowerCase();
    memoryStore[key] = {
      ...data,
      lastUsed: new Date().toISOString()
    };

    localStorage.setItem('ipayx.smartRoutes', JSON.stringify(memoryStore));

    return {
      success: true,
      data: memoryStore[key]
    };
  },

  // Simulate a payment
  simulatePayment: async (quote: any) => {
    if (!isDryRun()) {
      throw new Error('Real API not implemented - DRY_RUN mode required');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Payment simulated successfully (DRY_RUN mode)',
      transactionId: `DRY_RUN_${Date.now()}`,
      quote
    };
  }
};
