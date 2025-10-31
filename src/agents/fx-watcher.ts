// iPayX Protocol — Meta Router Agent V4
// FX Watcher (INR/PKR/GBP corridors) — NO crypto deps, single-file drop-in for lovable.dev
// - Zero external calls by default (pull-only). You can push signals via ingestSignal().
// - Computes risk scores + dynamic fee/spread suggestions around sensitive windows (e.g., RBI pre-market).
// - Exposes a clean API to plug into your pricing/quoting endpoints.

type Fiat = "USD" | "INR" | "PKR" | "GBP" | "EUR" | "CNY";
type Pair = `${Fiat}/${Fiat}`;

type Corridor = {
  pair: Pair;
  baseFeeBps: number;           // default 70 bps = 0.7%
  maxAdjBps: number;            // safety cap for dynamic adjustment
  sensitiveWindows?: SensitiveWindow[];
  flags?: {
    enabled: boolean;
    dynamicPricing: boolean;
    publishEvents: boolean;
  };
};

type SensitiveWindow = {
  label: string;
  // Local window using IANA tz. E.g., RBI pre-open ~ 09:00 IST (Asia/Kolkata)
  timezone: string;             // e.g., "Asia/Kolkata", "Asia/Karachi", "Europe/London"
  start: string;                // "HH:MM" 24h
  end: string;                  // "HH:MM" 24h
  days?: number[];              // 0=Sun .. 6=Sat (optional -> all days)
  boostBps?: number;            // fixed boost applied inside the window (safety buffer)
  riskWeight?: number;          // multiplier for computed risk during window
};

type SignalSource =
  | "MANUAL"
  | "RBI_INTERVENTION"
  | "IMF_PAKISTAN_PROGRAM"
  | "UPI_UK_POLICY"
  | "MARKET_VOL"
  | "LIQUIDITY_DRAIN"
  | "SPREAD_WIDENING"
  | "OTHER";

type FxSignal = {
  id?: string;
  source: SignalSource;
  corridor?: Pair;              // if omitted, applies to all enabled corridors
  timestamp: number;            // ms epoch
  // Magnitudes should be small normalized factors; we map to bps internally.
  magnitude?: number;           // 0..1 typical; >1 allowed but capped
  description?: string;
  ttlSec?: number;              // seconds this signal should be considered active
  tags?: string[];
};

type CorridorState = {
  pair: Pair;
  baseFeeBps: number;
  suggestedAdjBps: number;      // dynamic adjustment (can be negative but we clamp to [0..maxAdjBps] by default)
  totalFeeBps: number;          // base + suggestedAdjBps
  riskScore: number;            // 0..1 normalized (clamped)
  inSensitiveWindow: boolean;
  activeSignals: FxSignal[];
  lastComputedAt: number;
};

type WatcherConfig = {
  corridors: Corridor[];
  // global safety
  globalMaxAdjBps?: number;     // additional safety cap across all corridors
  decayHalfLifeSec?: number;    // how quickly signals decay (exponential)
  recomputeIntervalMs?: number; // default 10s
  eventBus?: {
    publish: (event: FxEvent) => void;
  };
};

type FxEvent =
  | { type: "FX_WATCHER_STARTED"; at: number }
  | { type: "FX_WATCHER_STOPPED"; at: number }
  | {
      type: "FX_STATE_UPDATED";
      at: number;
      states: CorridorState[];
    }
  | {
      type: "FX_SIGNAL_INGESTED";
      at: number;
      signal: FxSignal;
    };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Lightweight in-memory event bus (if none provided) */
class LocalBus {
  private subs: Array<(e: FxEvent) => void> = [];
  publish(e: FxEvent) { this.subs.forEach((fn) => fn(e)); }
  subscribe(fn: (e: FxEvent) => void) { this.subs.push(fn); return () => {
    const i = this.subs.indexOf(fn); if (i >= 0) this.subs.splice(i, 1);
  }; }
}

function nowMs() { return Date.now(); }

/** Parse "HH:MM" to minutes since midnight */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (h * 60) + (m || 0);
}

/** Get local day (0..6) and minutes for a timezone using Intl.DateTimeFormat */
function localDayAndMinutes(tz: string, t: number) {
  const d = new Date(t);
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const parts = fmt.formatToParts(d);
  const w = parts.find(p => p.type === "weekday")?.value ?? "Sun";
  const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
  const dayMap: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return { day: dayMap[w] ?? 0, minutes: h * 60 + m };
}

/** Exponential decay factor for signal magnitude based on TTL and half-life */
function decayedMagnitude(sig: FxSignal, t: number, halfLifeSec: number): number {
  const ageSec = (t - sig.timestamp) / 1000;
  const ttlOk = typeof sig.ttlSec === "number" ? ageSec <= sig.ttlSec : true;
  if (!ttlOk) return 0;
  const mag = typeof sig.magnitude === "number" ? sig.magnitude : 0.5;
  if (halfLifeSec <= 0) return mag;
  const lambda = Math.log(2) / halfLifeSec;
  const factor = Math.exp(-lambda * ageSec);
  return clamp(mag * factor, 0, 5);
}

/** Heuristic risk mapping per signal source (tunable) -> base bps impact and risk bump */
const SOURCE_WEIGHTS: Record<SignalSource, {bps: number; risk: number}> = {
  MANUAL:               { bps: 5,  risk: 0.05 },
  RBI_INTERVENTION:     { bps: 12, risk: 0.12 },
  IMF_PAKISTAN_PROGRAM: { bps: 9,  risk: 0.10 },
  UPI_UK_POLICY:        { bps: 6,  risk: 0.06 },
  MARKET_VOL:           { bps: 10, risk: 0.15 },
  LIQUIDITY_DRAIN:      { bps: 14, risk: 0.18 },
  SPREAD_WIDENING:      { bps: 11, risk: 0.14 },
  OTHER:                { bps: 6,  risk: 0.06 },
};

/** Default configuration covering INR, PKR, GBP corridors */
const DEFAULT_CONFIG: WatcherConfig = {
  corridors: [
    {
      pair: "USD/INR",
      baseFeeBps: 70,
      maxAdjBps: 40,
      flags: { enabled: true, dynamicPricing: true, publishEvents: true },
      sensitiveWindows: [
        {
          label: "RBI pre-open watch",
          timezone: "Asia/Kolkata",
          start: "08:30",
          end: "10:30",
          days: [1,2,3,4,5],
          boostBps: 5,
          riskWeight: 1.25,
        },
      ],
    },
    {
      pair: "USD/PKR",
      baseFeeBps: 70,
      maxAdjBps: 60,
      flags: { enabled: true, dynamicPricing: true, publishEvents: true },
      sensitiveWindows: [
        {
          label: "IMF/PK Monitoring",
          timezone: "Asia/Karachi",
          start: "09:00",
          end: "13:00",
          days: [1,2,3,4,5],
          boostBps: 6,
          riskWeight: 1.35,
        },
      ],
    },
    {
      pair: "GBP/INR",
      baseFeeBps: 70,
      maxAdjBps: 50,
      flags: { enabled: true, dynamicPricing: true, publishEvents: true },
      sensitiveWindows: [
        {
          label: "UK policy window",
          timezone: "Europe/London",
          start: "08:00",
          end: "11:00",
          days: [1,2,3,4,5],
          boostBps: 4,
          riskWeight: 1.15,
        },
      ],
    },
  ],
  globalMaxAdjBps: 75,
  decayHalfLifeSec: 3600,        // 1h half-life
  recomputeIntervalMs: 10_000,   // 10s
};

class FxWatcher {
  private cfg: WatcherConfig;
  private bus: LocalBus | null;
  private timer: any = null;
  private signals: FxSignal[] = [];
  private states: Record<Pair, CorridorState> = {} as any;

  constructor(cfg?: Partial<WatcherConfig>) {
    const merged: WatcherConfig = {
      ...DEFAULT_CONFIG,
      ...cfg,
      corridors: cfg?.corridors ?? DEFAULT_CONFIG.corridors,
    };
    this.cfg = merged;
    this.bus = merged.eventBus?.publish ? null : new LocalBus();

    // init states
    for (const c of this.cfg.corridors) {
      this.states[c.pair] = {
        pair: c.pair,
        baseFeeBps: c.baseFeeBps,
        suggestedAdjBps: 0,
        totalFeeBps: c.baseFeeBps,
        riskScore: 0,
        inSensitiveWindow: false,
        activeSignals: [],
        lastComputedAt: 0,
      };
    }
  }

  /** Subscribe to local events if using the built-in bus */
  onLocalEvent(fn: (e: FxEvent) => void) {
    if (!this.bus) return () => {};
    return this.bus.subscribe(fn);
  }

  private publish(e: FxEvent) {
    if (this.cfg.eventBus?.publish) this.cfg.eventBus.publish(e);
    if (this.bus) this.bus.publish(e);
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.recompute(), this.cfg.recomputeIntervalMs ?? 10_000);
    this.publish({ type: "FX_WATCHER_STARTED", at: nowMs() });
    // immediate compute
    this.recompute();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.publish({ type: "FX_WATCHER_STOPPED", at: nowMs() });
  }

  /** Push a new signal (no external fetch performed here) */
  ingestSignal(signal: FxSignal) {
    const s: FxSignal = {
      ...signal,
      id: signal.id ?? `${signal.source}-${Math.random().toString(36).slice(2)}`,
      timestamp: signal.timestamp ?? nowMs(),
    };
    this.signals.push(s);
    this.publish({ type: "FX_SIGNAL_INGESTED", at: nowMs(), signal: s });
  }

  /** Prune expired/fully decayed signals */
  private pruneSignals(t: number) {
    const halfLife = this.cfg.decayHalfLifeSec ?? 3600;
    this.signals = this.signals.filter((s) => {
      const alive = decayedMagnitude(s, t, halfLife) > 0.01;
      return alive;
    });
  }

  /** Check if now is within any sensitive window for the corridor */
  private computeWindowBoost(c: Corridor, t: number) {
    if (!c.sensitiveWindows?.length) return { inWin:false, extraBps:0, riskW:1 };
    for (const w of c.sensitiveWindows) {
      const { day, minutes } = localDayAndMinutes(w.timezone, t);
      const dayOk = (w.days && w.days.length) ? w.days.includes(day) : true;
      if (!dayOk) continue;
      const start = hhmmToMinutes(w.start);
      const end = hhmmToMinutes(w.end);
      if (start <= end) {
        if (minutes >= start && minutes <= end) {
          return { inWin:true, extraBps: w.boostBps ?? 0, riskW: w.riskWeight ?? 1 };
        }
      } else {
        // window spans midnight
        if (minutes >= start || minutes <= end) {
          return { inWin:true, extraBps: w.boostBps ?? 0, riskW: w.riskWeight ?? 1 };
        }
      }
    }
    return { inWin:false, extraBps:0, riskW:1 };
  }

  private corridorSignals(pair: Pair) {
    return this.signals.filter(s => !s.corridor || s.corridor === pair);
  }

  private recompute() {
    const t = nowMs();
    this.pruneSignals(t);

    const halfLife = this.cfg.decayHalfLifeSec ?? 3600;
    const globalCap = this.cfg.globalMaxAdjBps ?? 100;

    const newStates: CorridorState[] = [];

    for (const c of this.cfg.corridors) {
      const st = this.states[c.pair];
      const sigs = this.corridorSignals(c.pair);

      // Aggregate risk/impact
      let risk = 0;
      let bps = 0;
      const active: FxSignal[] = [];
      for (const s of sigs) {
        const mag = decayedMagnitude(s, t, halfLife);
        if (mag <= 0.005) continue;
        const w = SOURCE_WEIGHTS[s.source] || SOURCE_WEIGHTS.OTHER;
        // Heuristic combination:
        risk += w.risk * mag;
        bps  += w.bps  * mag;
        active.push(s);
      }

      // Sensitive window effects
      const win = this.computeWindowBoost(c, t);
      risk = clamp(risk * win.riskW, 0, 3);
      bps  = clamp(bps + win.extraBps, 0, 10_000);

      // Normalize to suggestedAdjBps
      // Map risk (0..~3) + bps impact -> final adj, capped by corridor + global caps.
      const riskAdj = Math.round( (risk * 25) );     // 0..75 bps from risk alone
      const impactAdj = Math.round( clamp(bps, 0, c.maxAdjBps) );
      const rawAdj = Math.max(riskAdj, impactAdj);   // take the more conservative (higher) suggestion

      const cap = Math.min(c.maxAdjBps, globalCap);
      const suggestedAdjBps = clamp(rawAdj, 0, cap);

      const inSensitive = win.inWin;
      const riskScore = clamp(risk / 3, 0, 1);       // 0..1

      const totalFeeBps = (c.flags?.dynamicPricing !== false)
        ? c.baseFeeBps + suggestedAdjBps
        : c.baseFeeBps;

      const newState: CorridorState = {
        pair: c.pair,
        baseFeeBps: c.baseFeeBps,
        suggestedAdjBps,
        totalFeeBps,
        riskScore,
        inSensitiveWindow: inSensitive,
        activeSignals: active,
        lastComputedAt: t,
      };

      this.states[c.pair] = newState;
      newStates.push(newState);
    }

    // publish
    const anyPublish = this.cfg.corridors.some(c => c.flags?.publishEvents);
    if (anyPublish) {
      this.publish({ type: "FX_STATE_UPDATED", at: t, states: newStates });
    }
  }

  /** Get current state snapshot */
  getStates(): CorridorState[] {
    return Object.values(this.states).sort((a,b) => a.pair.localeCompare(b.pair));
  }

  /** Get a single corridor state */
  getState(pair: Pair): CorridorState | undefined {
    return this.states[pair];
  }

  /** Quote helper: compute fee for an amount (in quote currency units), returning amounts and bps used */
  computePricing(pair: Pair, amountMinor: number, opts?: { overrideBaseBps?: number }): {
    pair: Pair;
    baseFeeBps: number;
    dynAdjBps: number;
    totalFeeBps: number;
    feeMinor: number;
    ts: number;
  } {
    const st = this.states[pair];
    if (!st) throw new Error(`Unknown corridor: ${pair}`);
    const base = typeof opts?.overrideBaseBps === "number" ? opts.overrideBaseBps : st.baseFeeBps;
    const totalBps = base + st.suggestedAdjBps;
    const feeMinor = Math.ceil((amountMinor * totalBps) / 10_000);
    return {
      pair,
      baseFeeBps: base,
      dynAdjBps: st.suggestedAdjBps,
      totalFeeBps: totalBps,
      feeMinor,
      ts: nowMs(),
    };
  }

  /** Utility: clear all signals (e.g., in tests) */
  clearSignals() { this.signals = []; this.recompute(); }

  /** Utility: seed common signals quickly (safe defaults) */
  seedPresets() {
    const t = nowMs();
    this.ingestSignal({ source: "RBI_INTERVENTION", timestamp: t - 5 * 60_000, magnitude: 0.8, corridor: "USD/INR", description: "Pre-market dollar sales chatter", ttlSec: 7200 });
    this.ingestSignal({ source: "IMF_PAKISTAN_PROGRAM", timestamp: t - 60 * 60_000, magnitude: 0.6, corridor: "USD/PKR", description: "Staff-level agreement headlines", ttlSec: 10_800 });
    this.ingestSignal({ source: "UPI_UK_POLICY", timestamp: t - 15 * 60_000, magnitude: 0.4, corridor: "GBP/INR", description: "UPI acceptance expansion commentary", ttlSec: 7200 });
  }
}

// ---------- Singleton export (recommended drop-in) ----------
let _watcher: FxWatcher | null = null;

/** Get the global FX Watcher instance (idempotent, safe to call multiple times) */
export function getFxWatcher(custom?: Partial<WatcherConfig>) {
  if (!_watcher) {
    _watcher = new FxWatcher(custom);
    _watcher.start();
  }
  return _watcher;
}

export type { FxSignal, SignalSource, CorridorState, Pair, WatcherConfig, FxEvent };
