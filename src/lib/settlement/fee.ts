/**
 * iPAYX Protocol - Settlement Asset Selection
 * USDC (default) or USDT (Tron)
 */

export type SettlementAsset = 'USDC' | 'USDT';
export type ChainType = 'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'tron' | 'hedera' | 'stellar' | 'sei';

/**
 * Choose settlement asset based on chain
 * Tron → USDT (native), Others → USDC
 */
export function chooseSettlement(chain: ChainType): SettlementAsset {
  return chain === 'tron' ? 'USDT' : 'USDC';
}

/**
 * Get settlement chain for iPAYX fees
 * Default: Polygon (low fees), Tron if USDT preferred
 */
export function getDefaultSettlementChain(preferUsdt: boolean = false): ChainType {
  return preferUsdt ? 'tron' : 'polygon';
}

/**
 * Calculate iPAYX fee (0.7% in USD)
 */
export function calculateIpayxFeeUsd(amountUsd: number): number {
  return +(amountUsd * 0.007).toFixed(2);
}

/**
 * Convert USD fee to local currency
 */
export function convertFeeToLocal(feeUsd: number, fxRate: number): number {
  return +(feeUsd * fxRate).toFixed(2);
}
