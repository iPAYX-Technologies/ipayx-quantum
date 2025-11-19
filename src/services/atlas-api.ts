/**
 * Atlas API Services - DRY_RUN Mode Stubs
 * All services return mock data when VITE_DRY_RUN=true
 */

const isDryRun = () => {
  return import.meta.env.VITE_DRY_RUN !== 'false';
};

// Payment Quote Service
export interface PaymentQuote {
  provider: string;
  feePct: string;
  spreadPct: string;
  eta: string;
  route: string;
  totalCost: string;
}

export const getPaymentQuotes = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  country: string
): Promise<PaymentQuote[]> => {
  if (isDryRun()) {
    // Return mock data in DRY_RUN mode
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            provider: 'NDAX',
            feePct: '0.20%',
            spreadPct: '~0.25%',
            eta: '2-4 hours',
            route: 'NDAX→USDC→Circle',
            totalCost: '0.45%'
          },
          {
            provider: 'Cybrid',
            feePct: 'Quote-only',
            spreadPct: 'Variable',
            eta: '1-3 hours',
            route: 'Cybrid API',
            totalCost: 'TBD'
          },
          {
            provider: 'Bank Wire',
            feePct: '$25-50',
            spreadPct: '2-3%',
            eta: '1-3 days',
            route: 'SWIFT/Wire',
            totalCost: '2-3% + fee'
          }
        ]);
      }, 500);
    });
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};

// Smart Routing Memory Service
export interface SmartRoute {
  country: string;
  recipient: string;
  method: string;
  amount: string;
  currency: string;
  timestamp: number;
}

export const getSmartRoutes = async (): Promise<SmartRoute[]> => {
  if (isDryRun()) {
    // In DRY_RUN mode, read from localStorage
    const stored = localStorage.getItem('ipayx.smartRoutes');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse smart routes:', e);
        return [];
      }
    }
    return [];
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};

export const saveSmartRoute = async (route: SmartRoute): Promise<void> => {
  if (isDryRun()) {
    // In DRY_RUN mode, save to localStorage
    const routes = await getSmartRoutes();
    const updatedRoutes = [route, ...routes.filter(r => r.country !== route.country).slice(0, 9)];
    localStorage.setItem('ipayx.smartRoutes', JSON.stringify(updatedRoutes));
    return;
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};

// Weather Service
export interface WeatherData {
  city: string;
  temp: string;
  condition: string;
}

export const getWeather = async (city: string = 'Montréal'): Promise<WeatherData> => {
  if (isDryRun()) {
    // Return mock data in DRY_RUN mode
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          city,
          temp: '12°C',
          condition: 'Partly Cloudy'
        });
      }, 200);
    });
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};

// Markets Service
export interface MarketData {
  cadUsd: { rate: string; change: string };
  btcUsdc: { rate: string; change: string };
}

export const getMarkets = async (): Promise<MarketData> => {
  if (isDryRun()) {
    // Return mock data in DRY_RUN mode
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cadUsd: { rate: '0.7234', change: '+0.12%' },
          btcUsdc: { rate: '43,250', change: '+2.34%' }
        });
      }, 200);
    });
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};

// News Service
export const getNews = async (): Promise<string[]> => {
  if (isDryRun()) {
    // Return mock data in DRY_RUN mode
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          'CAD strengthens against USD',
          'USDC adoption grows 15%',
          'Cross-border payments surge'
        ]);
      }, 200);
    });
  }

  // Real API call would go here
  throw new Error('Real API not implemented - set VITE_DRY_RUN=true');
};
