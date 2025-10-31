import { IPayxPlugin, QuoteInput, QuoteResult, TransferInput, TransferResult } from "../types";
import { backendAPI } from "@/services/backend-api";

export const hederaPlugin: IPayxPlugin = {
  name: "hedera-native",
  chains: ["hedera"],
  
  supports: (token) => token === "USDC" || token === "USDT",
  
  async quote(input: QuoteInput): Promise<QuoteResult> {
    return {
      provider: "hedera-native",
      feePct: 0.003,
      etaSec: 3,
      route: [input.fromChain, input.toChain],
      notes: "Hedera HCS - ultra low fees"
    };
  },
  
  async transfer(input: TransferInput): Promise<TransferResult> {
    const result = await backendAPI.hedera.sendTransaction({
      from: input.fromAddress,
      to: input.toAddress,
      amount: parseFloat(input.amount),
      tokenId: input.token
    });
    
    return {
      txHash: result.transactionId,
      explorerUrl: `https://hashscan.io/mainnet/transaction/${result.transactionId}`,
      status: result.status === "SUCCESS" ? "confirmed" : "failed"
    };
  },
  
  async health() {
    try {
      await backendAPI.hedera.getBalance("0.0.123");
      return "ok";
    } catch {
      return "down";
    }
  }
};
