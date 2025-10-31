import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";

export const tronPlugin: IPayxPlugin = {
  name: "tron-usdt",
  chains: ["tron"],
  
  supports: (token) => token === "USDT",
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    return {
      provider: "tron-usdt",
      feePct: 0.004,
      etaSec: 3,
      route: [input.fromChain, input.toChain],
      notes: "Tron TRC20 USDT - 3s finality, ~$1 fee"
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
        body: JSON.stringify({ ...input, provider: "tron-usdt" })
      }
    );
    
    if (!response.ok) throw new Error("Tron transfer failed");
    return await response.json();
  },
  
  async health() {
    return "ok";
  }
};
