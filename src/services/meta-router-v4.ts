import { githubBackend } from './github-backend-reader';

// iPAYX Protocol Fee (0.7%)
const IPAYX_FEE_PERCENTAGE = 0.007;

export interface RouteStep {
  step: number;
  type: 'onramp' | 'bridge' | 'offramp';
  provider: string;
  from: string;
  to: string;
  feePct: number;
  etaSec: number;
}

export interface RouteResult {
  route: RouteStep[];
  totalFeePct: number;
  totalEtaSec: number;
  breakdown: RouteStep[];
  ipayxFee: string;
  partnerFees: string;
  amountIn: number;
  amountOut: number;
  savings: string;
  score: number;
}

function isFiat(currency: string): boolean {
  return ["USD", "EUR", "CAD", "MYR", "NGN", "GBP", "INR", "MXN", "BRL"].includes(currency.toUpperCase());
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`;
  return `${Math.ceil(seconds / 3600)} hrs`;
}

/**
 * Calculate estimated savings vs traditional wire transfers.
 * 
 * ⚠️ LEGAL DISCLAIMER:
 * This calculation uses industry-average wire transfer fees (2.5%).
 * Actual savings may vary based on:
 * - Your bank's specific fee structure
 * - Third-party agreements outside iPAYX Protocol
 * - Exchange rate fluctuations
 * - Regulatory fees and charges
 * 
 * iPAYX Protocol cannot guarantee these savings as actual costs
 * depend on external factors beyond our control.
 */
function calculateSavings(amount: number, totalFeePct: number): string {
  const TYPICAL_TRADITIONAL_WIRE_FEE_PCT = 2.5; // Industry avg, not guaranteed
  const savings = amount * ((TYPICAL_TRADITIONAL_WIRE_FEE_PCT - totalFeePct) / 100);
  
  return savings > 0 
    ? `~$${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*` 
    : '$0*';
}

function calculateScore(
  route: RouteStep[], 
  totalFeePct: number, 
  totalEtaSec: number,
  priority: 'speed' | 'cost' | 'balanced' = 'balanced'
): number {
  const feeScore = Math.max(0, 100 - (totalFeePct * 10));
  const speedScore = Math.max(0, 100 - (totalEtaSec / 60));
  const hopsScore = Math.max(0, 100 - (route.length * 15));
  
  // Adjust weights based on priority
  if (priority === 'speed') {
    return speedScore * 0.7 + feeScore * 0.2 + hopsScore * 0.1;
  } else if (priority === 'cost') {
    return feeScore * 0.7 + speedScore * 0.2 + hopsScore * 0.1;
  } else {
    return feeScore * 0.5 + speedScore * 0.4 + hopsScore * 0.1;
  }
}

export async function findOptimalRoute(params: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  kyc?: boolean;
  priority?: 'speed' | 'cost' | 'balanced';
}): Promise<RouteResult> {
  const partners = await githubBackend.getPartners();
  
  // Fix #2: Validation pour éviter les crashes silencieux
  if (!Array.isArray(partners) || partners.length === 0) {
    if (import.meta.env.DEV) {
      console.error('⚠️ getPartners() returned invalid data:', partners);
    }
    throw new Error('Unable to fetch partner data. Please try again later.');
  }
  
  let route: RouteStep[] = [];
  let totalFeePct = 0;
  let totalEtaSec = 0;
  
  const needsOnramp = isFiat(params.fromCurrency);
  const needsOfframp = isFiat(params.toCurrency);
  
  if (needsOnramp && needsOfframp) {
    // Cas : Fiat → Crypto → Bridge → Fiat
    
    // Étape 1 : On-ramp (utiliser rails traditionnels avec KYC)
    const onramps = Array.isArray(partners) ? partners.filter((p: any) => p.type === 'kyc') : [];
    
    const onramp = onramps.find((p: any) => {
      const kycMatch = !params.kyc || p.type === 'kyc';
      return kycMatch;
    }) || onramps[0];
    
    if (onramp) {
      const cryptoAsset = onramp.asset || 'USDC';
      route.push({
        step: 1,
        type: "onramp",
        provider: onramp.name || 'Traditional Rail A',
        from: params.fromCurrency,
        to: cryptoAsset,
        feePct: onramp.baseFeePct || 0.90,
        etaSec: (onramp.latencyMin || 10) * 60
      });
      totalFeePct += onramp.baseFeePct || 0.90;
      totalEtaSec += (onramp.latencyMin || 10) * 60;
    }
    
    // Étape 2 : Bridge (Chainlink CCIP)
    const bridges = Array.isArray(partners) ? partners.filter((p: any) => p.provider === 'chainlink-ccip') : [];
    
    const bridge = bridges[0] || (Array.isArray(partners) ? partners.find((p: any) => p.name === 'Chainlink CCIP') : null);
    
    if (bridge) {
      route.push({
        step: 2,
        type: "bridge",
        provider: bridge.name || 'Chainlink CCIP',
        from: 'Ethereum',
        to: 'Stellar',
        feePct: bridge.baseFeePct || 0.15,
        etaSec: (bridge.latencyMin || 5) * 60
      });
      totalFeePct += bridge.baseFeePct || 0.15;
      totalEtaSec += (bridge.latencyMin || 5) * 60;
    }
    
    // Étape 3 : Off-ramp (rails sans KYC ou traditionnels)
    const offramps = Array.isArray(partners) ? partners.filter((p: any) => p.type === 'nkyc' || p.provider === 'traditional') : [];
    
    const offramp = offramps[0];
    
    if (offramp) {
      route.push({
        step: 3,
        type: "offramp",
        provider: offramp.name || 'Traditional Rail C',
        from: offramp.asset || 'USDC',
        to: params.toCurrency,
        feePct: offramp.baseFeePct || 0.80,
        etaSec: (offramp.latencyMin || 8) * 60
      });
      totalFeePct += offramp.baseFeePct || 0.80;
      totalEtaSec += (offramp.latencyMin || 8) * 60;
    }
  } else if (needsOnramp) {
    // Only onramp needed
    const onramps = Array.isArray(partners) ? partners.filter((p: any) => p.type === 'kyc') : [];
    const onramp: any = onramps[0] || (Array.isArray(partners) && partners[0]) || { name: 'Onramp', baseFeePct: 0.50, latencyMin: 5 };
    
    route.push({
      step: 1,
      type: "onramp",
      provider: onramp.name || 'Onramp',
      from: params.fromCurrency,
      to: params.toCurrency,
      feePct: onramp.baseFeePct || 0.50,
      etaSec: (onramp.latencyMin || 5) * 60
    });
    totalFeePct += onramp.baseFeePct || 0.50;
    totalEtaSec += (onramp.latencyMin || 5) * 60;
  } else if (needsOfframp) {
    // Only offramp needed
    const offramps = Array.isArray(partners) ? partners.filter((p: any) => p.type === 'nkyc') : [];
    const offramp: any = offramps[0] || (Array.isArray(partners) && partners[0]) || { name: 'Offramp', baseFeePct: 0.60, latencyMin: 6 };
    
    route.push({
      step: 1,
      type: "offramp",
      provider: offramp.name || 'Offramp',
      from: params.fromCurrency,
      to: params.toCurrency,
      feePct: offramp.baseFeePct || 0.60,
      etaSec: (offramp.latencyMin || 6) * 60
    });
    totalFeePct += offramp.baseFeePct || 0.60;
    totalEtaSec += (offramp.latencyMin || 6) * 60;
  }
  
  // Ajouter le frais iPAYX (0.7%)
  const ipayxFeePct = IPAYX_FEE_PERCENTAGE * 100;
  totalFeePct += ipayxFeePct;
  
  // Apply priority adjustments to fees and time
  if (params.priority === 'speed') {
    // Reduce latency by 20% for fastest route
    totalEtaSec = totalEtaSec * 0.8;
  } else if (params.priority === 'cost') {
    // Reduce fees by 15% for cheapest route
    totalFeePct = totalFeePct * 0.85;
  }
  
  const amountAfterFees = params.amount * (1 - totalFeePct / 100);
  const score = calculateScore(route, totalFeePct, totalEtaSec, params.priority);
  
  return {
    route,
    totalFeePct,
    totalEtaSec,
    breakdown: route,
    ipayxFee: ipayxFeePct.toFixed(1) + "%",
    partnerFees: (totalFeePct - ipayxFeePct).toFixed(2) + "%",
    amountIn: params.amount,
    amountOut: parseFloat(amountAfterFees.toFixed(2)),
    savings: calculateSavings(params.amount, totalFeePct),
    score
  };
}

export { formatEta, calculateSavings, isFiat };
