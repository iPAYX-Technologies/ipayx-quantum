export type RailInput = {
  name: string;
  feePct: number;
  etaMin: number;
  quoteFX: number;
  oracleFX: number;
  liq: number;
  vol: number;
  status: 'live' | 'down';
};

export type ScoringWeights = {
  feeWeight: number;      // Higher = penalizes fees more
  speedWeight: number;    // Higher = penalizes latency more
  spreadWeight: number;   // Higher = penalizes FX spread more
  liquidityWeight: number; // Higher = rewards liquidity more
  volatilityWeight: number; // Higher = penalizes volatility more
};

export const SCORING_PRESETS = {
  balanced: {
    feeWeight: 2,
    speedWeight: 0.1,
    spreadWeight: 10,
    liquidityWeight: 1,
    volatilityWeight: 5
  } as ScoringWeights,
  fast: {
    feeWeight: 1,
    speedWeight: 0.5,
    spreadWeight: 8,
    liquidityWeight: 0.8,
    volatilityWeight: 3
  } as ScoringWeights,
  cheap: {
    feeWeight: 4,
    speedWeight: 0.05,
    spreadWeight: 12,
    liquidityWeight: 0.5,
    volatilityWeight: 2
  } as ScoringWeights,
  safe: {
    feeWeight: 1.5,
    speedWeight: 0.05,
    spreadWeight: 15,
    liquidityWeight: 2,
    volatilityWeight: 8
  } as ScoringWeights
};

export function scoreRail(r: RailInput, weights: ScoringWeights = SCORING_PRESETS.balanced): number {
  const fxSpread = Math.abs(r.quoteFX - r.oracleFX);
  return (
    -r.feePct * weights.feeWeight -
    r.etaMin * weights.speedWeight -
    fxSpread * weights.spreadWeight +
    r.liq * weights.liquidityWeight -
    r.vol * weights.volatilityWeight +
    (r.status === 'live' ? 2 : -5)
  );
}

export function generateQuoteFX(oracleFX: number, seed: number): number {
  // Deterministic pseudo-random based on seed
  const random = (Math.sin(seed) * 10000) % 1;
  const spread = (Math.abs(random) * 0.04);
  return oracleFX + (random > 0.5 ? spread : -spread);
}