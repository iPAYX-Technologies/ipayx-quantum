import type { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";

/**
 * Chainlink CCIP Plugin
 * Connects to iPAYX Python backend which uses Chainlink CCIP contracts
 */
export const ccipPlugin: IPayxPlugin = {
  name: "chainlink-ccip",
  chains: ["ethereum", "polygon", "arbitrum", "base"],
  
  supports(token: QuoteInput["token"]): boolean {
    return token === "USDC" || token === "USDT";
  },

  async quote(input: QuoteInput): Promise<QuoteResult> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';
      
      const response = await fetch(`${backendUrl}/meta-router/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNetwork: input.fromChain.toUpperCase(),
          toNetwork: input.toChain.toUpperCase(),
          asset: input.token,
          amount: parseFloat(input.amount)
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Find CCIP route in response
      const ccipRoute = data.routes?.find((r: any) => r.provider === 'chainlink-ccip');
      
      if (ccipRoute) {
        return {
          provider: "chainlink-ccip",
          feePct: ccipRoute.feePct || 0.15,
          etaSec: ccipRoute.etaMin ? ccipRoute.etaMin * 60 : 300,
          route: ccipRoute.path || [input.fromChain, input.toChain],
          notes: "🔗 Verified by Chainlink CCIP"
        };
      }

      // Fallback if backend doesn't return CCIP route
      return {
        provider: "chainlink-ccip",
        feePct: 0.15,
        etaSec: 300,
        route: [input.fromChain, input.toChain],
        notes: "🔗 Multi-hop via Chainlink CCIP"
      };
    } catch (error) {
      console.error('CCIP quote error:', error);
      throw error;
    }
  },

  async transfer(input: TransferInput): Promise<TransferResult> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';
      
      const response = await fetch(`${backendUrl}/ccip/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: input.fromChain,
          toChain: input.toChain,
          token: input.token,
          amount: input.amount,
          fromAddress: input.fromAddress,
          toAddress: input.toAddress
        })
      });

      const data = await response.json();
      
      return {
        txHash: data.txHash || data.tx_hash,
        explorerUrl: data.explorerUrl,
        status: "submitted"
      };
    } catch (error) {
      console.error('CCIP transfer error:', error);
      throw error;
    }
  },

  async health(): Promise<"ok" | "down"> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';
      const response = await fetch(`${backendUrl}/health`, { method: 'GET' });
      return response.ok ? "ok" : "down";
    } catch {
      return "down";
    }
  }
};
