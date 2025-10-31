export type Rail = {
  name: string;
  type: "kyc" | "nkyc" | string;
  baseFeePct: number;     // base percentage fee (e.g., 0.75)
  latencyMin: number;     // estimated minutes
  liq: number;            // liquidity score (0-10)
  vol: number;            // volume share (0-1)
  provider: string;       // e.g., 'bridge' | 'tron' | 'stellar' | 'traditional'
};

export type RailsResponse = Rail[];
