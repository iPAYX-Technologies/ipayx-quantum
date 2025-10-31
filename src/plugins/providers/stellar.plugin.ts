import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";
import { supabase } from "@/integrations/supabase/client";

export const stellarPlugin: IPayxPlugin = {
  name: "stellar-sep24",
  chains: ["stellar"],
  
  supports: (token) => token === "USDC" || token === "EURC",
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    // Stellar anchors : 0.3% fee (moyenne MoneyGram/TEMPO/Circle), 5s settlement
    const feePct = 0.003;
    const etaSec = 5;
    
    return {
      provider: "stellar-sep24",
      feePct,
      etaSec,
      route: [input.fromChain, input.toChain],
      notes: `Stellar ${input.token} via anchor SEP-24 (interactive KYC)`
    };
  },
  
  async transfer(input: TransferInput): Promise<TransferResult> {
    try {
      const { data, error } = await supabase.functions.invoke("stellar-transfer", {
        body: {
          provider: "stellar-sep24",
          token: input.token,
          fromAddress: input.fromAddress,
          toAddress: input.toAddress,
          amount: input.amount,
          fromChain: input.fromChain,
          toChain: input.toChain
        }
      });
      
      if (error) throw error;
      
      return {
        txHash: data.txHash,
        explorerUrl: data.explorerUrl || `https://stellar.expert/explorer/public/tx/${data.txHash}`,
        status: "submitted"
      };
    } catch (error) {
      console.error("Stellar transfer failed:", error);
      return {
        txHash: "ERROR",
        status: "failed"
      };
    }
  },
  
  async health() {
    try {
      // TODO: Ping Horizon API pour vérifier santé réseau
      // const res = await fetch("https://horizon.stellar.org/");
      return "ok";
    } catch {
      return "down";
    }
  }
};
