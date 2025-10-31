import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";

export const evmPlugin: IPayxPlugin = {
  name: "evm-multi",
  chains: ["ethereum", "polygon", "arbitrum", "base"],
  
  supports: (token) => ["USDC", "USDT", "mUSD"].includes(token),
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    const feeMap: Record<string, number> = {
      ethereum: 0.007,
      polygon: 0.006,
      arbitrum: 0.005,
      base: 0.005
    };
    
    return {
      provider: "evm-multi",
      feePct: feeMap[input.fromChain] || 0.007,
      etaSec: input.fromChain === "ethereum" ? 720 : 120,
      route: [input.fromChain, input.toChain]
    };
  },
  
  async transfer(input: TransferInput): Promise<TransferResult> {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ ...input, provider: "evm-multi" })
      }
    );
    
    if (!response.ok) throw new Error("EVM transfer failed");
    return await response.json();
  },
  
  async health() {
    return "ok";
  }
};
