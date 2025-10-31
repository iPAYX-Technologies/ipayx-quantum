import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";
import { supabase } from "@/integrations/supabase/client";

export const xrplPlugin: IPayxPlugin = {
  name: "xrpl-native",
  chains: ["xrpl"],
  
  supports: (token) => token === "RLUSD" || token === "MPT",
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    // RLUSD : 0.2% fee, 4s ETA (XRPL settlement)
    // MPT : 0.25% fee, 4s ETA (bonds, attestations)
    const feePct = input.token === "RLUSD" ? 0.002 : 0.0025;
    const etaSec = 4;
    
    return {
      provider: "xrpl-native",
      feePct,
      etaSec,
      route: [input.fromChain, input.toChain],
      notes: input.token === "MPT" 
        ? "XRPL MPT - bonds & attestations support"
        : "XRPL RLUSD - Ripple USD stablecoin"
    };
  },
  
  async transfer(input: TransferInput): Promise<TransferResult> {
    try {
      const { data, error } = await supabase.functions.invoke("xrpl-transfer", {
        body: {
          provider: "xrpl-native",
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
        explorerUrl: data.explorerUrl || `https://livenet.xrpl.org/transactions/${data.txHash}`,
        status: "submitted"
      };
    } catch (error) {
      console.error("XRPL transfer failed:", error);
      return {
        txHash: "ERROR",
        status: "failed"
      };
    }
  },
  
  async health() {
    try {
      // TODO: Ping XRPL node via xrpl.js client.request({ command: 'server_info' })
      return "ok";
    } catch {
      return "down";
    }
  }
};
