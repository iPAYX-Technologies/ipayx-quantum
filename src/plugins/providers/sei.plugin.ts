import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";

export const seiPlugin: IPayxPlugin = {
  name: "sei-evm",
  chains: ["sei"],
  
  supports: (token) => token === "USDC",
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    return {
      provider: "sei-evm",
      feePct: 0.005,
      etaSec: 1,
      route: [input.fromChain, input.toChain],
      notes: "Sei EVM - fastest finality (0.49s)"
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
        body: JSON.stringify({ ...input, provider: "sei-evm" })
      }
    );
    
    if (!response.ok) throw new Error("Sei transfer failed");
    return await response.json();
  },
  
  async health() {
    return "ok";
  }
};
