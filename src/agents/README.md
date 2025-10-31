# 🚀 FX Watcher Agent V4

## 📊 Status
- ❌ **NOT CONNECTED TO PRODUCTION** (quotes endpoint unchanged)
- ✅ Available for testing at `/admin/fx-monitoring` (admin only)
- ✅ Zero crypto dependencies (pure TypeScript)

## 🎯 Purpose
Dynamic fee adjustment for sensitive FX corridors based on:
- Central bank interventions (RBI, IMF)
- Market volatility spikes
- Liquidity drains
- Sensitive time windows (e.g., RBI pre-open 08:30-10:30 IST)

## 🛡️ Safety Mechanisms
- **Per-corridor caps**: INR=40bps, PKR=60bps, GBP=50bps
- **Global cap**: 75 bps max adjustment
- **Exponential decay**: signals lose 50% impact after 1h (configurable)
- **TTL enforcement**: signals auto-expire after TTL

## 🔌 Usage (TEST ONLY)
```typescript
import { getFxWatcher } from '@/agents/fx-watcher';

// Get singleton instance (starts automatically)
const watcher = getFxWatcher();

// Ingest a manual signal
watcher.ingestSignal({
  source: "RBI_INTERVENTION",
  corridor: "USD/INR",
  magnitude: 0.8,
  ttlSec: 7200,
  description: "RBI dollar sales rumors"
});

// Get current state for a corridor
const state = watcher.getState("USD/INR");
console.log(state.totalFeeBps); // base + dynamic adjustment

// Compute pricing for a quote
const pricing = watcher.computePricing("USD/INR", 1000000); // 10k USD in cents
console.log(pricing.feeMinor); // fee amount in minor units
```

## 🔄 Future Activation (NOT NOW)
To connect to production quotes:
1. Add real signal sources (external APIs, webhooks)
2. Run A/B testing with subset of users
3. Integrate in `supabase/functions/quote/index.ts`:
   ```typescript
   import { getFxWatcher } from "../../src/agents/fx-watcher.ts";
   const watcher = getFxWatcher();
   const dynamicPricing = watcher.computePricing(pair, amount);
   const totalFeePct = dynamicPricing.totalFeeBps / 10000;
   ```

## 📈 Corridors Covered
- **USD/INR**: RBI interventions, UPI policy changes
- **USD/PKR**: IMF program compliance, currency controls
- **GBP/INR**: UK-India UPI expansion, Brexit spillover

## 🧪 Testing Presets
Use `watcher.seedPresets()` to load demo signals:
- RBI intervention (5 min ago, mag=0.8)
- IMF Pakistan program (1h ago, mag=0.6)
- UPI UK policy (15 min ago, mag=0.4)

## 📋 Signal Sources
- `MANUAL` - Manual testing signals
- `RBI_INTERVENTION` - Reserve Bank of India market operations
- `IMF_PAKISTAN_PROGRAM` - IMF Pakistan compliance updates
- `UPI_UK_POLICY` - UK-India UPI policy changes
- `MARKET_VOL` - Volatility spikes
- `LIQUIDITY_DRAIN` - Liquidity shortages
- `SPREAD_WIDENING` - Market spread increases
- `OTHER` - Miscellaneous signals

## 🔒 Security
- **Admin-only access**: Dashboard requires admin role
- **No external calls**: Pull-only architecture (no automatic API fetches)
- **Isolated from production**: Zero impact on live quotes
- **Reversible**: `clearSignals()` resets all dynamic adjustments immediately
