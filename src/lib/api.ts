import type { Rail, RailsResponse } from "../types/rails";

const DEFAULT_PROXY_BASE = "";

function getProxyBase() {
  // In Next.js on client, base '' is fine for relative Edge Function routes
  return DEFAULT_PROXY_BASE;
}

export async function fetchRails(options?: { signal?: AbortSignal }): Promise<Rail[]> {
  const base = getProxyBase();
  const url = `${base}/proxy-github/meta-router?t=${Date.now()}`; // cache-bust in debug
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    signal: options?.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Rails fetch failed: ${res.status} ${res.statusText} ${text ? "- " + text : ""}`);
  }
  const data = (await res.json()) as RailsResponse;
  if (!Array.isArray(data)) {
    throw new Error("Invalid rails payload (expected array)");
  }
  return data;
}

// Utility: compute a composite score for ranking rails.
// Lower fee and latency are better; higher liquidity and volume are better.
// We normalize roughly and weight: fee 40%, latency 25%, liq 25%, vol 10%.
export function scoreRail(r: Rail): number {
  // Fee normalization (lower better) → invert
  const fee = Math.max(0, 1 - Math.min(1, r.baseFeePct)); // assume baseFeePct already in [0..1+]
  // Latency normalization (lower better) → assume 0-12min typical
  const lat = Math.max(0, 1 - Math.min(1, r.latencyMin / 12));
  // Liquidity normalization
  const liq = Math.min(1, Math.max(0, r.liq / 10));
  // Volume normalization (already 0..1)
  const vol = Math.min(1, Math.max(0, r.vol));

  const score = fee * 0.4 + lat * 0.25 + liq * 0.25 + vol * 0.1;
  return Number(score.toFixed(4));
}
