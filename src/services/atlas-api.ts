/**
 * Atlas API Service - DRY_RUN Mode
 * 
 * This service provides stub API responses when DRY_RUN mode is enabled.
 * No real network calls are made in DRY_RUN mode.
 */

const isDryRun = import.meta.env.VITE_DRY_RUN === 'true' || true;

// In-memory storage for Smart Routing Memory (DRY_RUN only)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const smartRoutesMemory: Record<string, unknown> = {};

export interface QuoteProvider {
  provider: string;
  feePct: number;
  spreadPct: number;
  eta: string;
  route: string;
  estimatedTotal?: number;
}

export interface SmartRoute {
  country: string;
  recipient?: string;
  amount?: number;
  currency?: string;
  beneficiary?: string;
  method?: string;
  lastUsed?: string;
}

/**
 * Get payment quotes from multiple providers
 */
export async function getPaymentQuotes(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  toCountry: string
): Promise<QuoteProvider[]> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const baseAmount = amount;
  
  return [
    {
      provider: 'NDAX',
      feePct: 0.20,
      spreadPct: 0.25,
      eta: '2-4 hours',
      route: 'NDAX→USDC→Circle',
      estimatedTotal: baseAmount * (1 - 0.0020 - 0.0025),
    },
    {
      provider: 'Cybrid',
      feePct: 0.30,
      spreadPct: 0.35,
      eta: '1-2 hours',
      route: 'Cybrid→USDC',
      estimatedTotal: baseAmount * (1 - 0.0030 - 0.0035),
    },
    {
      provider: 'Bank Wire',
      feePct: 0.50,
      spreadPct: 1.00,
      eta: '1-2 days',
      route: 'SWIFT→Local Bank',
      estimatedTotal: baseAmount * (1 - 0.0050 - 0.0100),
    },
  ];
}

/**
 * Get Smart Routing Memory for a user
 */
export async function getSmartRoutingMemory(): Promise<SmartRoute[]> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  // In DRY_RUN, use localStorage
  const stored = localStorage.getItem('ipayx.smartRoutes');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Save Smart Routing Memory entry
 */
export async function saveSmartRoutingMemory(route: SmartRoute): Promise<void> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  // In DRY_RUN, use localStorage
  const existing = await getSmartRoutingMemory();
  const updated = [
    route,
    ...existing.filter(r => r.country !== route.country || r.recipient !== route.recipient)
  ].slice(0, 10); // Keep last 10 routes
  
  localStorage.setItem('ipayx.smartRoutes', JSON.stringify(updated));
}

/**
 * Get weather widget data (stub)
 */
export async function getWeatherWidget(): Promise<any> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    location: 'Montréal',
    temperature: 18,
    condition: 'Partly Cloudy',
    icon: '⛅',
  };
}

/**
 * Get market widget data (stub)
 */
export async function getMarketWidget(): Promise<any> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    pairs: [
      { pair: 'CAD/USD', rate: 0.7245, change: '+0.12%', trend: 'up' },
      { pair: 'BTC/USDC', rate: 67234.50, change: '-1.23%', trend: 'down' },
    ],
  };
}

/**
 * Get news widget data (stub)
 */
export async function getNewsWidget(): Promise<any> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    items: [
      { title: 'USDC adoption grows in cross-border payments', time: '2h ago' },
      { title: 'New regulations boost crypto remittance sector', time: '5h ago' },
      { title: 'Stablecoin transfers hit record high in Q4', time: '1d ago' },
    ],
  };
}

/**
 * Submit a payment (stub)
 */
export async function submitPayment(paymentData: any): Promise<any> {
  if (!isDryRun) {
    throw new Error('Real API calls not implemented yet');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    transactionId: `DRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Payment submitted successfully (DRY_RUN mode - no real transaction)',
    estimatedArrival: '2-4 hours',
  };
}
