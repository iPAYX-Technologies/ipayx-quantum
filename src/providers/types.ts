export type ProviderName = 'ndax' | 'crossmint' | 'transak' | 'cybrid';

export interface ProviderQuote {
  provider: ProviderName;
  fee: number;
  eta: number; // minutes
  available: boolean;
}

export interface OnRampParams {
  fiatCurrency: string;
  cryptoCurrency: string;
  amount: number;
  userCountry: string;
  paymentMethod: string;
}

export type GetQuoteFn = (params: OnRampParams) => Promise<ProviderQuote>;
