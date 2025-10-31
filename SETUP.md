# 🚀 iPAYX Setup Guide - Configuration complète

**Projet :** iPAYX Protocol  
**Stack :** React + TypeScript + Vite + Supabase  
**Date :** 2025-10-30

---

## Table des matières

1. [Connexion Supabase](#1-connexion-supabase)
2. [Secrets backend (Edge Functions)](#2-secrets-backend-edge-functions)
3. [Dépendances (Frontend + Backend)](#3-dépendances)
4. [Build & Dev (Local + Production)](#4-build--dev)
5. [Deploy Edge Functions](#5-deploy-edge-functions)
6. [Structure projet](#6-structure-projet)
7. [Tests (E2E Playwright)](#7-tests)
8. [Multilingue (i18n)](#8-multilingue)
9. [Monitoring & Logs](#9-monitoring--logs)
10. [Sécurité (RLS, 2FA, Rate Limiting)](#10-sécurité)

---

## 1️⃣ Connexion Supabase

### **Variables d'environnement (Frontend)**

**Fichier :** `.env` (auto-généré par Lovable Cloud, NE PAS ÉDITER)

```bash
VITE_SUPABASE_URL=https://ggkymbeyesuodnoogzyb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna3ltYmV5ZXN1b2Rub29nenliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzkwNDcsImV4cCI6MjA3NTQxNTA0N30.jehD4mkOcTJcUd0qt-Au2h8Gksbifqe1PUw6VOQF_ZA
VITE_SUPABASE_PROJECT_ID=ggkymbeyesuodnoogzyb
```

**⚠️ IMPORTANT :** Ce fichier est automatiquement créé et mis à jour par Lovable Cloud. Ne jamais éditer manuellement.

---

### **Utilisation dans le code (Frontend)**

```typescript
// src/integrations/supabase/client.ts (auto-généré)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Exemple d'utilisation :**
```typescript
import { supabase } from '@/integrations/supabase/client';

// Get user profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## 2️⃣ Secrets backend (Edge Functions)

### **Configuration via Supabase CLI**

**Prérequis :**
```bash
# Installer Supabase CLI
brew install supabase/tap/supabase  # macOS
# ou
npm install -g supabase              # Cross-platform

# Login Supabase
supabase login
```

---

### **Secrets critiques (Production)**

```bash
# Service role key (admin DB access)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
  --project-ref ggkymbeyesuodnoogzyb

# SendGrid (email automation)
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb

# Coinbase Commerce (on-ramp)
supabase secrets set COINBASE_API_KEY=xxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb

# Circle API (USDC mint/burn)
supabase secrets set CIRCLE_API_KEY=xxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb

# iPAYX Settlement Wallet
supabase secrets set IPAYX_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1 \
  --project-ref ggkymbeyesuodnoogzyb

supabase secrets set IPAYX_WALLET_PRIVATE_KEY=xxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb

# Perplexity AI (chatbot)
supabase secrets set PERPLEXITY_API_KEY=pplx-xxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb

# Lovable AI Gateway (GPT-5, Gemini)
supabase secrets set LOVABLE_API_KEY=lovable_xxxxxxxx \
  --project-ref ggkymbeyesuodnoogzyb
```

---

### **Utilisation dans Edge Functions**

```typescript
// supabase/functions/quote/index.ts
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const CIRCLE_API_KEY = Deno.env.get('CIRCLE_API_KEY');

if (!SENDGRID_API_KEY) {
  throw new Error('Missing SENDGRID_API_KEY secret');
}

// Send email via SendGrid
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(emailPayload)
});
```

---

### **Liste tous les secrets**

```bash
supabase secrets list --project-ref ggkymbeyesuodnoogzyb
```

**Output :**
```
SENDGRID_API_KEY
COINBASE_API_KEY
CIRCLE_API_KEY
IPAYX_WALLET_ADDRESS
IPAYX_WALLET_PRIVATE_KEY
PERPLEXITY_API_KEY
LOVABLE_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## 3️⃣ Dépendances

### **Frontend (React + TypeScript + Vite)**

**Fichier :** `package.json`

```json
{
  "name": "ipayx-protocol",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.74.0",
    "@tanstack/react-query": "^5.83.0",
    "react-router-dom": "^6.30.1",
    "framer-motion": "^12.23.22",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "tailwindcss": "^3.4.17",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "three": "^0.160.1",
    "@react-three/fiber": "^8.18.0",
    "@react-three/drei": "^9.122.0",
    "recharts": "^2.15.4",
    "zod": "^3.25.76",
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "sonner": "^1.7.4",
    "lucide-react": "^0.462.0",
    "date-fns": "^3.6.0",
    "canvas-confetti": "^1.9.3",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.3",
    "react-qr-code": "^2.0.18",
    "react-helmet-async": "^2.0.5",
    "next-themes": "^0.3.0",
    "swagger-ui-react": "^5.29.4"
  },
  "devDependencies": {
    "vite": "^5.4.19",
    "typescript": "^5.8.3",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/three": "^0.160.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49"
  }
}
```

**Installation :**
```bash
npm install
```

---

### **Backend (Edge Functions - Deno)**

**⚠️ Aucune dépendance npm à installer** (runtime Deno auto-géré par Supabase).

**Imports HTTP standards :**
```typescript
// Exemple: supabase/functions/meta-router/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://esm.sh/zod@3.22.4";
```

**Modules disponibles via Deno :**
- HTTP server : `deno.land/std/http/server.ts`
- Supabase client : `esm.sh/@supabase/supabase-js`
- Validation : `esm.sh/zod`
- Crypto : `deno.land/std/crypto`
- JWT : `esm.sh/jose`

---

## 4️⃣ Build & Dev

### **Dev local (Hot Module Replacement)**

```bash
npm run dev
```

**Output :**
```
VITE v5.4.19  ready in 342 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Features :**
- ✅ HMR (Hot Module Replacement)
- ✅ Fast Refresh (React components)
- ✅ TypeScript type checking
- ✅ Tailwind JIT compilation

---

### **Build production**

```bash
npm run build
```

**Output :**
```
vite v5.4.19 building for production...
✓ 1247 modules transformed.
dist/index.html                   0.49 kB │ gzip:  0.32 kB
dist/assets/index-B2x9f3Qc.css   89.42 kB │ gzip: 12.34 kB
dist/assets/index-DfG7hJ8k.js  2,134.56 kB │ gzip: 567.89 kB
✓ built in 12.34s
```

**Fichiers générés :**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css  (89 KB)
│   ├── index-[hash].js   (2.1 MB)
│   ├── hero-blockchain-speed-[hash].png
│   └── ... (autres assets)
└── public/ (copied)
```

---

### **Preview production local**

```bash
npm run preview
```

**Output :**
```
➜  Local:   http://localhost:4173/
➜  Network: use --host to expose
```

**Utilité :** Tester le build de production localement avant deploy.

---

## 5️⃣ Deploy Edge Functions

### **Prérequis**

```bash
# Login Supabase CLI
supabase login

# Link au projet
supabase link --project-ref ggkymbeyesuodnoogzyb
```

---

### **Deploy toutes les functions (35 actives)**

```bash
supabase functions deploy --project-ref ggkymbeyesuodnoogzyb
```

**Output :**
```
Deploying Functions...
✓ meta-router deployed (v1.2.3)
✓ quote deployed (v1.0.5)
✓ transfer deployed (v1.1.2)
✓ fees deployed (v1.0.1)
✓ coinbase-checkout deployed (v1.3.0)
✓ ... (30 autres functions)

All functions deployed successfully!
```

---

### **Deploy une function spécifique**

```bash
supabase functions deploy meta-router --project-ref ggkymbeyesuodnoogzyb
```

---

### **Logs en temps réel**

```bash
supabase functions logs meta-router --project-ref ggkymbeyesuodnoogzyb --follow
```

**Output :**
```
2025-10-30T15:32:41Z [meta-router] INFO Request: POST /meta-router
2025-10-30T15:32:41Z [meta-router] INFO Input: {"from":"CAD","to":"USD","amount":10000}
2025-10-30T15:32:42Z [meta-router] INFO Quote generated: stellar-sep24 (score: 8.5)
2025-10-30T15:32:42Z [meta-router] INFO Response: 200 (1.2s)
```

---

## 6️⃣ Structure projet

```
ipayx-protocol/
├── src/                           # Frontend React
│   ├── components/                # UI components (28 fichiers)
│   │   ├── ui/                    # shadcn/ui primitives (40 fichiers)
│   │   ├── ChatbotWidget.tsx
│   │   ├── SmartContactForm.tsx
│   │   ├── ROICalculator.tsx
│   │   ├── PartnerLogos.tsx
│   │   ├── GlobalNetworkMap.tsx
│   │   └── ...
│   ├── pages/                     # Routes (18 pages)
│   │   ├── Landing.tsx            # Homepage
│   │   ├── Dashboard.tsx          # User dashboard
│   │   ├── Quote.tsx              # Quote calculator
│   │   ├── MetaRouter.tsx         # Meta-router demo
│   │   ├── Auth.tsx               # Login/signup
│   │   ├── Profile.tsx            # User settings
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/              # Client auto-généré
│   │       ├── client.ts          # Supabase client (DO NOT EDIT)
│   │       └── types.ts           # Database types (DO NOT EDIT)
│   ├── lib/                       # Utils
│   │   ├── pricing/
│   │   │   └── oracle.ts          # FX rates oracle
│   │   ├── settlement/
│   │   │   └── fee.ts             # iPAYX fee calculation
│   │   ├── scoring.ts             # Rail scoring + Lead scoring
│   │   ├── quote.ts               # Quote generation
│   │   ├── analytics.ts           # Event tracking
│   │   ├── utils.ts               # Helpers (cn, formatters)
│   │   └── savingsWidget.config.ts # ROI calculator
│   ├── hooks/                     # Custom React hooks
│   │   ├── useMetrics.ts
│   │   ├── useUserTransactions.ts
│   │   ├── useMetaMask.tsx
│   │   └── use-mobile.tsx
│   ├── i18n/                      # Multilingue
│   │   └── locales/
│   │       ├── en.json            # English
│   │       └── fr.json            # Français
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Auth state
│   │   └── LanguageContext.tsx    # i18n state
│   ├── data/                      # JSON static
│   │   ├── rails.json             # Payment rails config
│   │   ├── chains.json            # Blockchain metadata
│   │   ├── countries.json         # Country list
│   │   └── scenarios.json         # Demo scenarios
│   ├── assets/                    # Images (logos, hero, features)
│   ├── services/                  # API clients
│   │   ├── api.ts
│   │   ├── backend-api.ts
│   │   ├── github-backend-reader.ts
│   │   └── meta-router-v4.ts
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles + Design tokens
├── supabase/
│   ├── functions/                 # 35 edge functions (Deno)
│   │   ├── meta-router/           # Main routing engine
│   │   ├── quote/                 # Quote generation
│   │   ├── transfer/              # Payment execution
│   │   ├── fees/                  # Fee calculation
│   │   ├── coinbase-checkout/     # Coinbase on-ramp
│   │   ├── coinbase-webhook/      # Coinbase webhooks
│   │   ├── circle-payment/        # Circle USDC mint
│   │   ├── chatbot/               # AI chatbot (Perplexity)
│   │   ├── smart-contact/         # Lead scoring (Lovable AI)
│   │   ├── campaign-manager/      # Email automation
│   │   ├── fx-rates/              # FX oracle
│   │   ├── crypto-prices/         # Crypto pricing
│   │   └── ... (23 autres)
│   ├── migrations/                # SQL schema (auto-généré)
│   │   └── 20250101000000_initial_schema.sql
│   └── config.toml                # Edge functions config (DO NOT EDIT)
├── public/
│   ├── openapi.yaml               # API spec (OpenAPI 3.1)
│   ├── sdks/                      # Client SDKs
│   │   ├── typescript/            # @ipayx/sdk
│   │   ├── python/                # ipayx-py
│   │   ├── cli/                   # ipayx-cli
│   │   └── widget/                # Embeddable widget
│   ├── blog/
│   │   └── meta-router-explained.html
│   ├── contracts/
│   │   └── IpayxRegistry.sol      # Solidity contract
│   └── .well-known/
│       └── security.txt           # Security contact
├── docs/
│   ├── CLIENT_INTEGRATION.md      # API integration guide
│   ├── ONRAMP_SETUP.md            # Payment rails setup
│   ├── meta-router-api.md         # Meta-router spec
│   └── security/
│       └── headers.md
├── vite.config.ts                 # Vite config
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── .env                           # Env vars (auto-généré)
└── README.md                      # Project docs
```

---

## 7️⃣ Tests

### **E2E (Playwright)**

**Installation :**
```bash
npm install -D @playwright/test
```

**Run tests :**
```bash
npx playwright test
```

**Config :** `.github/workflows/playwright-e2e.yml`

```yaml
name: Playwright E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8️⃣ Multilingue

### **Langues supportées**

- 🇬🇧 English (default)
- 🇫🇷 Français

**Fichiers :**
- `src/i18n/locales/en.json`
- `src/i18n/locales/fr.json`

---

### **Ajout nouvelle langue**

**Étape 1 : Créer fichier traduction**
```bash
cp src/i18n/locales/en.json src/i18n/locales/es.json
```

**Étape 2 : Traduire les clés**
```json
{
  "landing": {
    "hero": {
      "title": "Pagos transfronterizos instantáneos",
      "subtitle": "Ahorra 65-77% en comisiones"
    }
  }
}
```

**Étape 3 : Ajouter dans `LanguageContext.tsx`**
```typescript
import esTranslations from './locales/es.json';

const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
};
```

---

### **Utilisation**

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('landing.hero.title')}</h1>
      <button onClick={() => setLanguage('fr')}>Français</button>
    </div>
  );
}
```

---

## 9️⃣ Monitoring & Logs

### **Supabase Dashboard**

**URL :** `https://supabase.com/dashboard/project/ggkymbeyesuodnoogzyb`

**Sections :**
- 📊 **Metrics** : API calls, Database queries, Storage usage
- 📝 **Logs** : Edge functions, Database, Auth
- 🔐 **Auth** : User management, Providers
- 🗄️ **Database** : Table editor, SQL editor
- 🔧 **Edge Functions** : Deployments, Logs
- 📦 **Storage** : File management

---

### **Frontend Analytics**

**Fichier :** `src/lib/analytics.ts`

```typescript
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  console.log('[Analytics]', eventName, properties);
  
  // Send to analytics service (ex: PostHog, Mixpanel)
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventName, properties })
  });
}
```

**Usage :**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('quote_requested', {
  corridor: 'CAD-USD',
  amount: 100000,
  user_id: userId
});
```

---

## 🔟 Sécurité

### **RLS Policies (Row Level Security)**

**Toutes les tables ont RLS activé :**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**60+ RLS policies actives** couvrant :
- `profiles`, `user_roles`, `user_accounts`
- `api_keys`, `leads`, `campaigns`
- `transaction_logs`, `ipayx_fees`
- `organizations`, `projects`
- `webhook_events`, `activity_logs`

---

### **2FA (TOTP)**

**Activation via `/profile` :**
1. User clique "Enable 2FA"
2. Frontend appelle `supabase/functions/enable-2fa`
3. Backend génère secret TOTP + QR code
4. User scanne QR code (Google Authenticator, Authy)
5. User entre code 6-digit pour valider
6. Backend stocke `two_factor_secret` dans `profiles`

**Login avec 2FA :**
```typescript
// Step 1: Email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

// Step 2: TOTP verification
await fetch('/supabase/functions/verify-2fa', {
  method: 'POST',
  body: JSON.stringify({ userId: data.user.id, code: '123456' })
});
```

---

### **API Rate Limiting**

**IP-based (Global) :**
- 60 requests/min par IP
- Table : `ip_rate_limits`
- Middleware : `supabase/functions/_shared/ip-rate-limiter.ts`

**API key-based (Per-plan) :**
| Plan | Limits | Monthly cost |
|------|--------|--------------|
| **Sandbox** | 30 RPM, 10k req/month | Free |
| **Starter** | 60 RPM, 100k req/month | $49/month |
| **Pro** | 300 RPM, 1M req/month | $199/month |

**Implémentation :**
```typescript
// supabase/functions/quote/index.ts
import { checkRateLimit } from '../_shared/rate-limiter';

const { allowed, remaining } = await checkRateLimit(apiKey);
if (!allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

---

### **CORS & Security Headers**

**Edge Functions headers :**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff'
};
```

**Production :** Remplacer `*` par domaine spécifique (`https://ipayx.ai`).

---

## 📚 Support

### **Documentation complète**

1. **API Integration** : `docs/CLIENT_INTEGRATION.md`
2. **Payment Rails Setup** : `docs/ONRAMP_SETUP.md`
3. **Meta-Router API** : `docs/meta-router-api.md`
4. **OpenAPI Spec** : `public/openapi.yaml`
5. **Security Policies** : `SECURITY.md`
6. **Formulas** : `FORMULAS.md`

---

### **Contact**

- 📧 Email : support@ipayx.ai
- 💬 Chat IA : ChatbotWidget (sur toutes les pages)
- 🐛 Bug reports : GitHub Issues
- 🔐 Security : security@ipayx.ai

---

**🎉 Setup complet documenté !**
