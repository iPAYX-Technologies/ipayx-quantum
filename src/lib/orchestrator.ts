type ProviderName = 'ndax' | 'crossmint' | 'transak';

interface ProviderQuote {
  provider: ProviderName;
  fee: number;
  eta: number; // minutes
  available: boolean;
}

interface OnRampParams {
  fiatCurrency: string;
  cryptoCurrency: string;
  amount: number;
  userCountry: string;
  paymentMethod: string;
}

const providers = ['ndax', 'crossmint', 'transak'] as ProviderName[];

// Simule un appel API provider (remplace par vraies intégrations)
async function getQuote(provider: ProviderName, params: OnRampParams): Promise<ProviderQuote> {
  // TODO: Plug NDAX, Crossmint, Transak API ici
  if (provider === 'ndax') return { provider, fee: 0.002, eta: 15, available: params.userCountry === 'CA' };
  if (provider === 'crossmint') return { provider, fee: 0, eta: 5, available: true };
  if (provider === 'transak') return { provider, fee: 0.03, eta: 10, available: true };
  throw new Error('Unknown provider');
}

export async function routeOnRamp(params: OnRampParams) {
  const quotes = await Promise.all(providers.map(p => getQuote(p, params)));
  const available = quotes.filter(q => q.available);
  if (!available.length) throw new Error('No provider available');
  // Choisit le moins cher, puis le plus rapide
  available.sort((a, b) => a.fee - b.fee || a.eta - b.eta);
  return available[0];
}