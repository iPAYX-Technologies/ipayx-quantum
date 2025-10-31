// savingsWidget.config.ts  — iPayX (texte + logique, sans styling)
// À importer où tu veux dans Lovable.dev. Aucun changement visuel requis.

export const PRICING = {
  IPAYX_FLAT_FEE: 0.007,        // 0,7 % iPayX sur volume exécuté
  LEGACY_MIN_ALL_IN: 0.02,      // 2 % banques/PSP (plancher comparatif)
  LEGACY_MAX_ALL_IN: 0.03       // 3 % banques/PSP (plafond comparatif)
};

// === Fonctions de calcul (ne touchent pas au look) ===
export function calcIpayxFee(volume: number): number {
  return round(volume * PRICING.IPAYX_FLAT_FEE);
}
export function calcLegacyRange(volume: number): { min: number; max: number } {
  return {
    min: round(volume * PRICING.LEGACY_MIN_ALL_IN),
    max: round(volume * PRICING.LEGACY_MAX_ALL_IN),
  };
}
export function calcSavings(volume: number): { min: number; max: number } {
  const ipx = calcIpayxFee(volume);
  const leg = calcLegacyRange(volume);
  return {
    min: clampPositive(leg.min - ipx),
    max: clampPositive(leg.max - ipx),
  };
}
function round(n: number) { return Math.round(n * 100) / 100; }
function clampPositive(n: number) { return n < 0 ? 0 : round(n); }

// === i18n (FR/EN) : libellés, validations, tooltips, messages ===
export const i18n = {
  fr: {
    heroTitle: "Obtenir un devis",
    heroSubtitle: "Fiat-à-fiat à vitesse blockchain. Smart routing multi-rails.",

    // Champs / actions
    amount: "Montant",
    from: "Devise source",
    to: "Devise cible",
    kyc: "Niveau KYC",
    kyc_none: "Aucun (permissionless)",
    kyc_light: "Allégé",
    kyc_full: "Complet",
    cta_quote: "Obtenir un devis",
    cta_execute: "Exécuter ce paiement",

    // Module économies (widget)
    annualVolume: "Volume annuel de transactions",
    legacyRow: "Banques traditionnelles (frais tout-inclus 2–3 %)",
    ipayxRow: "Frais iPayX (forfait 0,7 % sur volume exécuté)",
    savingsRow: "Économies estimées vs banques",
    seeHowItWorks: "Voir comment ça marche",
    getCustomQuote: "Obtenir un devis personnalisé",

    // Résultats du devis
    resultTitle: "Devis obtenu",
    rail: "Rail",
    fx_rate: "Taux FX",
    spread: "Spread (pbs)",
    fees_total: "Frais totaux",
    eta: "Délai estimé",
    disclaimer: "Estimation indicative. Le forfait iPayX de 0,7 % est inclus dans « Frais totaux ». Des frais réseaux/on-ramp peuvent s'ajouter selon le corridor.",

    // Validations
    valid_min: "Le montant minimal est 5 000.",
    valid_diff: "Les devises source et cible doivent être différentes.",

    // Erreurs
    loading: "Calcul du devis…",
    error_generic: "Impossible d'obtenir le devis. Réessayez.",
    error_provider: "Le fournisseur sélectionné est temporairement indisponible.",
    kyc_required: "Un niveau KYC plus élevé est requis pour ce montant/corridor.",

    // Tooltips / notes (à brancher en info-bulle)
    tt_legacy: "L'intervalle 2–3 % reflète les frais bancaires/PSP typiques (FX inclus) observés sur des volumes B2B.",
    tt_ipayx: "Le 0,7 % couvre le smart-routing multi-rails, l'orchestration KYC/KYB, la supervision et les webhooks.",
    tt_variables: "Frais réseaux (gas), on-ramp/off-ramp spécifiques et spreads externes peuvent s'appliquer selon le corridor."
  },

  en: {
    heroTitle: "Get a Quote",
    heroSubtitle: "Fiat-to-fiat at blockchain speed. Multi-rail smart routing.",

    // Fields / actions
    amount: "Amount",
    from: "Source currency",
    to: "Target currency",
    kyc: "KYC level",
    kyc_none: "None (permissionless)",
    kyc_light: "Light",
    kyc_full: "Full",
    cta_quote: "Get Quote",
    cta_execute: "Execute this payment",

    // Savings widget
    annualVolume: "Annual Transaction Volume",
    legacyRow: "Legacy banks (all-in 2–3%)",
    ipayxRow: "iPayX fee (0.7% flat on executed volume)",
    savingsRow: "Estimated savings vs legacy",
    seeHowItWorks: "See How It Works",
    getCustomQuote: "Get Custom Quote",

    // Quote result
    resultTitle: "Quote",
    rail: "Rail",
    fx_rate: "FX Rate",
    spread: "Spread (bps)",
    fees_total: "Total fees",
    eta: "Estimated time",
    disclaimer: "Indicative estimate. iPayX 0.7% flat fee included in 'Total fees'. Network/on-ramp fees may apply depending on corridor.",

    // Validation
    valid_min: "Minimum amount is 5,000.",
    valid_diff: "Source and target currencies must differ.",

    // Errors
    loading: "Computing quote…",
    error_generic: "Could not fetch quote. Please retry.",
    error_provider: "Selected provider is temporarily unavailable.",
    kyc_required: "A higher KYC level is required for this amount/corridor.",

    // Tooltips
    tt_legacy: "The 2–3% band reflects typical bank/PSP all-in costs (incl. FX) observed in B2B volumes.",
    tt_ipayx: "The 0.7% covers multi-rail smart-routing, KYC/KYB orchestration, supervision and webhooks.",
    tt_variables: "Network fees, on-/off-ramp specifics and external FX spreads may apply per corridor."
  }
} as const;

// === Aides d'affichage (montants) ===
export function fmtCurrency(n: number, locale: 'fr'|'en', ccy: string = 'USD'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-US', {
    style: 'currency',
    currency: ccy,
    maximumFractionDigits: 0
  }).format(n);
}