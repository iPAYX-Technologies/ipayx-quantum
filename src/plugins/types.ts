export type ChainId = "ethereum" | "polygon" | "arbitrum" | "base" | "sei" | "hedera" | "tron" | "stellar" | "xrpl";

export interface QuoteInput {
  fromChain: ChainId;
  toChain: ChainId;
  token: "USDC" | "USDT" | "mUSD" | "EURC" | "RLUSD" | "MPT";
  amount: string;
}

export interface QuoteResult {
  provider: string;
  feePct: number;
  etaSec: number;
  route: string[];
  notes?: string;
}

export interface TransferInput extends QuoteInput {
  fromAddress: string;
  toAddress: string;
}

export interface TransferResult {
  txHash: string;
  explorerUrl?: string;
  status: "submitted" | "confirmed" | "failed";
}

export interface IPayxPlugin {
  name: string;
  chains: ChainId[];
  supports(token: QuoteInput["token"]): boolean;
  quote(input: QuoteInput): Promise<QuoteResult>;
  transfer(input: TransferInput): Promise<TransferResult>;
  health(): Promise<"ok" | "down">;
}
