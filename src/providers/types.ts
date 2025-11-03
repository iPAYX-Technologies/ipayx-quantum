/**
 * Shared types for onramp/offramp provider routing
 */

/**
 * Parameters for requesting an onramp quote
 */
export interface OnRampParams {
  /** Amount in fiat currency (e.g., CAD, USD) */
  fiatAmount: number;
  /** Fiat currency code (ISO 4217) */
  fiatCurrency: string;
  /** Crypto asset to receive (e.g., USDC, BTC, ETH) */
  cryptoAsset: string;
  /** Target blockchain network */
  network?: string;
  /** Optional: User's wallet address for receiving crypto */
  walletAddress?: string;
}

/**
 * Standardized quote response from any provider
 */
export interface ProviderQuote {
  /** Provider name (e.g., "Cybrid", "NDAX", "Transak") */
  provider: string;
  /** Amount of fiat being converted */
  fiatAmount: number;
  /** Fiat currency code */
  fiatCurrency: string;
  /** Amount of crypto to receive */
  cryptoAmount: number;
  /** Crypto asset code */
  cryptoAsset: string;
  /** Exchange rate used */
  exchangeRate: number;
  /** Total fees charged (in fiat currency) */
  totalFees: number;
  /** Estimated time to complete (in seconds) */
  estimatedTimeSec: number;
  /** Target blockchain network */
  network?: string;
  /** Additional metadata from provider */
  metadata?: Record<string, unknown>;
}

/**
 * Function signature for provider quote adapters
 */
export type GetQuoteFn = (params: OnRampParams) => Promise<ProviderQuote>;
