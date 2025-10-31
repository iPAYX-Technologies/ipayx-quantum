export type Asset = "USDC" | "USDT" | "XLM" | "ETH" | "SOL" | "CAD" | "USD" | "EUR" | "MYR" | "NGN" | string;

export type Network =
  | "ETHEREUM" 
  | "BASE" 
  | "AVAX" 
  | "SOLANA" 
  | "TRON" 
  | "STELLAR" 
  | "POLYGON"
  | "ARBITRUM"
  | "OPTIMISM";

export interface QuoteInput {
  fromNetwork: Network;
  toNetwork: Network;
  asset: Asset;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
}

export interface QuoteOutput {
  provider: string;
  totalFee: number;
  gasEst?: string;
  etaSec?: number;
  riskScore?: number;
  notes?: string;
  raw?: any;
  messariMetrics?: {
    volatility?: number;
    sentiment?: number;
    volume_24h?: number;
  };
  score?: number;
}

export interface IRouteProvider {
  name: string;
  supports(input: QuoteInput): boolean;
  quote(input: QuoteInput): Promise<QuoteOutput>;
  execute?(input: QuoteInput & { meta?: any }): Promise<{ txid: string }>;
}

export interface MessariMetrics {
  volatility: number;
  sentiment: number;
  volume_24h: number;
  price?: number;
  market_cap?: number;
}
