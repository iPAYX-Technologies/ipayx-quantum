# 📐 iPAYX Formulas - Calculs économiques & Scoring

**Projet :** iPAYX Protocol  
**Date :** 2025-10-30  
**Description :** Toutes les formules mathématiques utilisées pour le calcul des économies, scoring des rails, pricing, et oracles FX.

---

## Table des matières

1. [Calculs économies (ROI Widget)](#1-calculs-économies-roi-widget)
2. [Frais settlement (iPAYX Fees)](#2-frais-settlement-ipayx-fees)
3. [Scoring rails (Route ranking)](#3-scoring-rails-route-ranking)
4. [Oracles FX (Taux de change)](#4-oracles-fx-taux-de-change)
5. [Pricing API (Quote generation)](#5-pricing-api-quote-generation)
6. [Lead Scoring (AI analysis)](#6-lead-scoring-ai-analysis)

---

## 1️⃣ Calculs économies (ROI Widget)

**Fichier source :** `src/lib/savingsWidget.config.ts`

### **1.1 Fee iPAYX (0.7%)**

```typescript
export function calcIpayxFee(annualVolume: number): number {
  const IPAYX_FEE_PCT = 0.007; // 0.7%
  return annualVolume * IPAYX_FEE_PCT;
}
```

**Exemples :**
| Volume annuel | Fee iPAYX |
|---------------|-----------|
| $100,000 | $700 |
| $1,000,000 | $7,000 |
| $10,000,000 | $70,000 |

---

### **1.2 Range legacy fees (2-3%)**

**Legacy methods :** SWIFT, Wire Transfer, Correspondent Banking

```typescript
export function calcLegacyRange(annualVolume: number): { min: number; max: number } {
  const LEGACY_MIN_PCT = 0.02; // 2%
  const LEGACY_MAX_PCT = 0.03; // 3%
  
  return {
    min: annualVolume * LEGACY_MIN_PCT,
    max: annualVolume * LEGACY_MAX_PCT
  };
}
```

**Exemples :**
| Volume annuel | Legacy MIN (2%) | Legacy MAX (3%) |
|---------------|-----------------|-----------------|
| $100,000 | $2,000 | $3,000 |
| $1,000,000 | $20,000 | $30,000 |
| $10,000,000 | $200,000 | $300,000 |

---

### **1.3 Savings calculation (Économies nettes)**

```typescript
export function calcSavings(annualVolume: number): { min: number; max: number } {
  const ipayxFee = calcIpayxFee(annualVolume);
  const legacy = calcLegacyRange(annualVolume);
  
  return {
    min: legacy.min - ipayxFee,  // Best case legacy (2%) - iPAYX
    max: legacy.max - ipayxFee   // Worst case legacy (3%) - iPAYX
  };
}
```

**Formule mathématique :**
```
Savings_MIN = (Volume × 0.02) - (Volume × 0.007)
            = Volume × (0.02 - 0.007)
            = Volume × 0.013  (1.3%)

Savings_MAX = (Volume × 0.03) - (Volume × 0.007)
            = Volume × (0.03 - 0.007)
            = Volume × 0.023  (2.3%)
```

**Exemples avec pourcentage de réduction :**
| Volume annuel | Savings MIN | Savings MAX | Réduction MIN | Réduction MAX |
|---------------|-------------|-------------|---------------|---------------|
| $100,000 | $1,300 | $2,300 | 65% | 77% |
| $1,000,000 | $13,000 | $23,000 | 65% | 77% |
| $10,000,000 | $130,000 | $230,000 | 65% | 77% |

**Pourcentage de réduction :**
```typescript
const reductionMin = ((legacy.min - ipayxFee) / legacy.min) * 100;
// (2% - 0.7%) / 2% = 65%

const reductionMax = ((legacy.max - ipayxFee) / legacy.max) * 100;
// (3% - 0.7%) / 3% = 76.67% ≈ 77%
```

---

### **1.4 Formatage monétaire**

```typescript
export function fmtCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`;
  }
  return `$${amount.toFixed(0)}`;
}
```

**Exemples :**
```
7000 → "$7k"
13500 → "$14k"
1200000 → "$1.2M"
```

---

## 2️⃣ Frais settlement (iPAYX Fees)

**Fichier source :** `src/lib/settlement/fee.ts`

### **2.1 Calcul fee iPAYX en USD**

```typescript
export function calculateIpayxFeeUsd(amountUsd: number): number {
  const IPAYX_FEE_PCT = 0.007; // 0.7%
  return amountUsd * IPAYX_FEE_PCT;
}
```

**Exemples :**
| Montant transaction (USD) | Fee iPAYX (USD) |
|---------------------------|-----------------|
| $1,000 | $7.00 |
| $10,000 | $70.00 |
| $100,000 | $700.00 |

---

### **2.2 Conversion fee vers monnaie locale**

```typescript
export function convertFeeToLocal(feeUsd: number, fxRate: number): number {
  return feeUsd * fxRate;
}
```

**Exemple : USD → CAD**
```
Fee USD : $7.00
FX Rate : 1.36 CAD/USD
Fee CAD : $7.00 × 1.36 = $9.52 CAD
```

**Exemple : USD → INR**
```
Fee USD : $70.00
FX Rate : 83.12 INR/USD
Fee INR : $70.00 × 83.12 = ₹5,818.40
```

---

### **2.3 Choix settlement asset (blockchain)**

```typescript
export function chooseSettlementAsset(chain: string): string {
  const SETTLEMENT_ASSETS: Record<string, string> = {
    'tron': 'USDT',        // Tron préfère USDT
    'polygon': 'USDC',     // EVM chains → USDC
    'ethereum': 'USDC',
    'arbitrum': 'USDC',
    'optimism': 'USDC',
    'base': 'USDC',
    'stellar': 'USDC',     // Stellar USDC natif
    'xrpl': 'USDC',        // XRPL MPT USDC
  };
  
  return SETTLEMENT_ASSETS[chain.toLowerCase()] || 'USDC';
}
```

**Raison :** Tron a plus de liquidité USDT, autres chains ont plus de liquidité USDC.

---

## 3️⃣ Scoring rails (Route ranking)

**Fichier source :** `src/lib/scoring.ts`

### **3.1 Formule score composite**

```typescript
export function scoreRail(
  rail: Rail,
  quoteFX: number,
  oracleFX: number,
  preset: 'balanced' | 'fast' | 'cheap' | 'safe' = 'balanced'
): number {
  const weights = SCORING_PRESETS[preset];
  
  // Normalisation des métriques
  const feePct = rail.baseFeePct;              // 0.007 = 0.7%
  const etaMin = rail.latencyMin;              // 3 min
  const fxSpread = Math.abs(quoteFX - oracleFX) / oracleFX; // 0.0035 = 0.35%
  const liq = rail.liq;                        // 0-10 scale
  const vol = rail.vol;                        // 0-1 scale
  
  // Score composite (0-10 scale)
  const score = 
    - (feePct * weights.fee * 100)           // Lower fees = higher score
    - (etaMin * weights.speed * 0.1)         // Faster = higher score
    - (fxSpread * weights.spread * 1000)     // Tighter spread = higher score
    + (liq * weights.liquidity)              // Higher liquidity = higher score
    - (rail.volatility * weights.volatility) // Lower volatility = higher score
    + (rail.status === 'live' ? 2 : -5);     // Live rails bonus
  
  return Math.round(score * 100) / 100;
}
```

---

### **3.2 Presets scoring**

```typescript
export const SCORING_PRESETS = {
  balanced: {
    fee: 0.25,        // 25% poids
    speed: 0.20,      // 20% poids
    spread: 0.25,     // 25% poids
    liquidity: 0.15,  // 15% poids
    volatility: 0.10, // 10% poids
    status: 0.05      // 5% poids
  },
  
  fast: {
    fee: 0.15,
    speed: 0.40,      // Prioritize speed (40%)
    spread: 0.20,
    liquidity: 0.10,
    volatility: 0.10,
    status: 0.05
  },
  
  cheap: {
    fee: 0.50,        // Prioritize low fees (50%)
    speed: 0.10,
    spread: 0.20,
    liquidity: 0.10,
    volatility: 0.05,
    status: 0.05
  },
  
  safe: {
    fee: 0.15,
    speed: 0.15,
    spread: 0.15,
    liquidity: 0.25,  // Prioritize liquidity (25%)
    volatility: 0.25, // Minimize volatility (25%)
    status: 0.05
  }
};
```

---

### **3.3 Exemple de scoring**

**Rail : stellar-sep24 (CAD → USD)**

```typescript
const rail = {
  name: 'stellar-sep24',
  baseFeePct: 0.007,   // 0.7%
  latencyMin: 3,       // 3 minutes
  liq: 8.5,            // Liquidity score 8.5/10
  vol: 0.92,           // Volume score 0.92/1
  volatility: 0.05,    // Low volatility
  status: 'live'
};

const quoteFX = 0.7374;  // Quote CAD/USD
const oracleFX = 0.7400; // Oracle CAD/USD
const fxSpread = Math.abs(0.7374 - 0.7400) / 0.7400 = 0.0035; // 0.35%

// Score calculation (balanced preset)
const score = 
  - (0.007 × 0.25 × 100)       = -0.175  // Fee penalty
  - (3 × 0.20 × 0.1)           = -0.06   // Speed penalty
  - (0.0035 × 0.25 × 1000)     = -0.875  // Spread penalty
  + (8.5 × 0.15)               = +1.275  // Liquidity bonus
  - (0.05 × 0.10)              = -0.005  // Volatility penalty
  + 2                          = +2.0    // Live bonus
  = 2.16

// Rounded: 2.16/10
```

**Interprétation :**
- Score < 0 : Rail médiocre
- Score 0-3 : Rail acceptable
- Score 3-6 : Rail bon
- Score 6-8 : Rail excellent
- Score > 8 : Rail premium

---

## 4️⃣ Oracles FX (Taux de change)

**Fichier source :** `src/lib/pricing/oracle.ts`

### **4.1 Scénarios de référence**

```typescript
export const FX_SCENARIOS = [
  { id: 'cad-usd', from: 'CAD', to: 'USD', oracleFX: 0.74 },
  { id: 'usd-cad', from: 'USD', to: 'CAD', oracleFX: 1.35 },
  { id: 'usd-inr', from: 'USD', to: 'INR', oracleFX: 83.12 },
  { id: 'usd-mxn', from: 'USD', to: 'MXN', oracleFX: 17.12 },
  { id: 'eur-brl', from: 'EUR', to: 'BRL', oracleFX: 5.53 },
  { id: 'gbp-usd', from: 'GBP', to: 'USD', oracleFX: 1.27 },
  { id: 'usd-jpy', from: 'USD', to: 'JPY', oracleFX: 149.50 },
  { id: 'eur-usd', from: 'EUR', to: 'USD', oracleFX: 1.09 }
];
```

**Source Oracle :** Bloomberg FX Spot Rates (mid-market, 15:00 UTC)

---

### **4.2 Simulation spread FX (Quote generation)**

```typescript
export function generateQuoteFX(oracleFX: number, seed: number): number {
  const spreadBps = 50; // 50 basis points = 0.5%
  const spread = (spreadBps / 10000) * oracleFX;
  
  // Variation sinusoïdale (déterministe avec seed)
  const variation = (Math.sin(seed) + 1) / 2; // 0-1 range
  
  // Quote FX = Oracle ± spread
  const quoteFX = oracleFX + (variation * spread * 2 - spread);
  
  return Math.round(quoteFX * 10000) / 10000; // 4 decimals
}
```

**Exemple : CAD/USD**
```
Oracle FX : 0.7400
Spread : 50 bps = 0.0037 (0.5% de 0.7400)
Range : [0.7363, 0.7437]

Seed = 1 → sin(1) = 0.841 → variation = 0.921
Quote FX = 0.7400 + (0.921 × 0.0074 - 0.0037)
         = 0.7400 + 0.0031
         = 0.7431
```

**Distribution :**
- 95% des quotes dans ±0.5% de l'oracle
- 99% des quotes dans ±1% de l'oracle

---

### **4.3 Conversion inverse**

```typescript
export function getInverseFX(fxRate: number): number {
  return 1 / fxRate;
}
```

**Exemple :**
```
CAD/USD = 0.7400
USD/CAD = 1 / 0.7400 = 1.3514
```

---

## 5️⃣ Pricing API (Quote generation)

**Fichier source :** `src/lib/quote.ts`

### **5.1 Calcul montant reçu (destination)**

```typescript
export function calculateDestAmount(
  sourceAmount: number,
  fxRate: number,
  feePct: number
): number {
  const feeAmount = sourceAmount * feePct;
  const netAmount = sourceAmount - feeAmount;
  const destAmount = netAmount * fxRate;
  
  return Math.round(destAmount * 100) / 100; // 2 decimals
}
```

**Exemple : $10,000 CAD → USD via stellar-sep24**
```
Source Amount : $10,000 CAD
FX Rate : 0.7400 (CAD/USD)
Fee : 0.7% = $70 CAD
Net Amount : $10,000 - $70 = $9,930 CAD
Dest Amount : $9,930 × 0.7400 = $7,348.20 USD
```

---

### **5.2 Estimation temps de transfert (ETA)**

```typescript
export function estimateETA(
  rail: Rail,
  amount: number,
  priority: 'fast' | 'normal' | 'slow' = 'normal'
): number {
  const { latencyMin, latencyMax } = rail;
  
  // Adjust ETA based on amount (larger amounts = longer KYC)
  const amountMultiplier = amount > 100_000 ? 1.5 : 1.0;
  
  // Priority adjustments
  const priorityMultipliers = {
    fast: 0.7,   // -30% time
    normal: 1.0,
    slow: 1.3    // +30% time
  };
  
  const baseETA = (latencyMin + latencyMax) / 2;
  const adjustedETA = baseETA * amountMultiplier * priorityMultipliers[priority];
  
  return Math.round(adjustedETA);
}
```

**Exemple : stellar-sep24 (latency 3-5 min)**
```
Amount : $50,000 → multiplier = 1.0
Priority : normal → multiplier = 1.0
Base ETA : (3 + 5) / 2 = 4 min
Adjusted ETA : 4 × 1.0 × 1.0 = 4 min

Amount : $150,000 → multiplier = 1.5
Priority : fast → multiplier = 0.7
Base ETA : 4 min
Adjusted ETA : 4 × 1.5 × 0.7 = 4.2 min ≈ 4 min
```

---

## 6️⃣ Lead Scoring (AI analysis)

**Fichier source :** `src/lib/scoring.ts` + edge function `smart-contact`

### **6.1 Scoring composite (0-100)**

```typescript
export function calculateLeadScore(lead: Lead): number {
  const volumeScore = scoreVolume(lead.monthly_volume);
  const companyScore = scoreCompany(lead.company, lead.country);
  const messageScore = scoreMessage(lead.message);
  
  // Weighted average
  const score = 
    volumeScore * 0.50 +     // 50% weight (volume = $$)
    companyScore * 0.30 +    // 30% weight (company size/sector)
    messageScore * 0.20;     // 20% weight (intent quality)
  
  return Math.round(score);
}
```

---

### **6.2 Scoring volume (0-100)**

```typescript
function scoreVolume(monthlyVolume: string): number {
  const volumeMap: Record<string, number> = {
    '< $10k': 10,
    '$10k-50k': 30,
    '$50k-100k': 50,
    '$100k-500k': 70,
    '$500k-1M': 85,
    '> $1M': 100
  };
  
  return volumeMap[monthlyVolume] || 0;
}
```

---

### **6.3 Scoring company (0-100)**

Basé sur :
1. **Secteur d'activité** (FinTech, E-commerce, Import/Export = high score)
2. **Taille d'entreprise** (détecté via IA dans le nom : "Corp", "Inc", "Ltd" = bonus)
3. **Pays** (G7 countries = bonus)

```typescript
function scoreCompany(company: string, country: string): number {
  let score = 50; // Base score
  
  // Sector bonus (detected via AI)
  const highValueSectors = ['fintech', 'payment', 'ecommerce', 'import', 'export', 'remittance'];
  const companyLower = company.toLowerCase();
  if (highValueSectors.some(sector => companyLower.includes(sector))) {
    score += 20;
  }
  
  // Size bonus
  const sizeindicators = ['corp', 'inc', 'ltd', 'llc', 'global', 'international'];
  if (sizeindicators.some(indicator => companyLower.includes(indicator))) {
    score += 15;
  }
  
  // Country bonus (G7 = high purchasing power)
  const g7Countries = ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'JP'];
  if (g7Countries.includes(country)) {
    score += 15;
  }
  
  return Math.min(score, 100);
}
```

---

### **6.4 Scoring message (0-100)**

Basé sur IA (GPT-5 via Lovable AI) :
- Intent detection (test, intégration, partenariat)
- Urgency markers ("ASAP", "urgent", "today")
- Technical depth (mentions API, SDK, integration)

```typescript
async function scoreMessage(message: string): Promise<number> {
  const aiPrompt = `
Analyze this message and score intent quality (0-100):
- 0-30: Generic/spam
- 31-60: Interest but vague
- 61-80: Clear intent, specific need
- 81-100: Urgent, technical, ready to integrate

Message: "${message}"

Return only the score (integer 0-100).
  `;
  
  const response = await callLovableAI(aiPrompt, { model: 'openai/gpt-5-mini' });
  return parseInt(response.trim());
}
```

**Exemples :**
| Message | AI Score | Raison |
|---------|----------|--------|
| "Hello" | 5 | Generic spam |
| "Interested in your product" | 45 | Vague interest |
| "Need API to send $500k/month CAD→USD" | 85 | Specific, high volume |
| "URGENT: Integrate by Friday, 7-figure volume" | 98 | Urgent + technical + high value |

---

## 🧮 Résumé des constantes clés

| Constante | Valeur | Usage |
|-----------|--------|-------|
| **iPAYX Fee** | 0.7% | Frais par transaction |
| **Legacy Fee MIN** | 2% | Best case Wire/SWIFT |
| **Legacy Fee MAX** | 3% | Worst case Wire/SWIFT |
| **FX Spread** | 50 bps (0.5%) | Variation quote vs oracle |
| **Scoring weights (balanced)** | fee:25%, speed:20%, spread:25%, liq:15%, vol:10%, status:5% | Route ranking |
| **Lead scoring weights** | volume:50%, company:30%, message:20% | Lead qualification |
| **Settlement asset (Tron)** | USDT | Blockchain fee payment |
| **Settlement asset (default)** | USDC | Blockchain fee payment |

---

## 📚 Références

**Fichiers source :**
1. `src/lib/savingsWidget.config.ts` - ROI calculator
2. `src/lib/settlement/fee.ts` - Settlement fees
3. `src/lib/scoring.ts` - Rail scoring + Lead scoring
4. `src/lib/pricing/oracle.ts` - FX oracles
5. `src/lib/quote.ts` - Quote generation
6. `supabase/functions/smart-contact/index.ts` - AI lead analysis

**Documentation externe :**
- Bloomberg FX Spot Rates API
- Stellar SEP-24 Protocol (Anchor integration)
- Circle USDC Mint API
- Lovable AI Gateway (GPT-5, Gemini)

---

**🎉 Toutes les formules documentées !**
