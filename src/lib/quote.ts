import { getCurrencyForCountry } from './countries';
import railsData from '@/data/rails.json';

// Utilisation des vrais rails depuis rails.json
const rails = railsData;

// Données hardcodées des scénarios
const scenarios = [
  {"id":"cad-usd","from":"CAD","to":"USD","amount":50000,"oracle":{"ref":0.74}},
  {"id":"usd-inr","from":"USD","to":"INR","amount":10000,"oracle":{"ref":83.12}},
  {"id":"usd-mxn","from":"USD","to":"MXN","amount":10000,"oracle":{"ref":17.12}},
  {"id":"eur-brl","from":"EUR","to":"BRL","amount":25000,"oracle":{"ref":5.53}}
];

// Fonction de scoring
function scoreRail(r: any): number {
  const fxSpread = Math.abs(r.quoteFX - r.oracleFX);
  return (
    -r.feePct * 2 -
    r.etaMin / 10 -
    fxSpread * 10 +
    r.liq -
    r.vol * 5 +
    (r.status === 'live' ? 2 : -5)
  );
}

// Taux de change approximatifs (1 USD = X de cette devise)
function getOracleFX(fromCurrency: string, toCurrency: string): number {
  const rates: Record<string, number> = {
    'USD': 1.0,
    'CAD': 1.35,
    'EUR': 0.92,
    'GBP': 0.79,
    'INR': 83.12,
    'MXN': 17.12,
    'BRL': 5.53,
    'ARS': 850.0,
    'COP': 4200.0,
    'MYR': 4.47,
    'NGN': 1580.0,
    'JPY': 149.0,
    'CNY': 7.24,
    'AUD': 1.52,
    'CHF': 0.88,
    'RUB': 92.0,
    'ZAR': 18.5,
    'SGD': 1.34,
    'HKD': 7.82,
    'SEK': 10.8,
    'NOK': 10.9,
    'DKK': 6.86,
    'PLN': 4.01,
    'THB': 35.2,
    'IDR': 15800.0,
    'TRY': 32.5,
    'KRW': 1340.0,
    'NZD': 1.66,
    'CLP': 980.0,
    'PHP': 56.3,
    'CZK': 23.1,
    'ILS': 3.66,
    'HUF': 361.0,
    'AED': 3.67,
    'SAR': 3.75,
    'VND': 25300.0,
    'EGP': 48.5,
    'MAD': 10.1,
    'KES': 129.0,
    'GHS': 15.8,
    'UGX': 3700.0,
    'TZS': 2550.0,
    'PKR': 278.0,
    'BDT': 109.0,
    'LKR': 296.0,
    'NPR': 133.0
  };
  
  const fromRate = rates[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || 1.0;
  
  // Conversion: 1 fromCurrency = X toCurrency
  return toRate / fromRate;
}

// Génération de quoteFX déterministe
function generateQuoteFX(oracleFX: number, seed: number): number {
  const random = (Math.sin(seed) * 10000) % 1;
  const spread = (Math.abs(random) * 0.04);
  return oracleFX + (random > 0.5 ? spread : -spread);
}

// Fonction principale pour obtenir un quote
export function getQuote(fromCode: string, toCode: string, amount: number, kyc: boolean) {
  // Convertir codes pays en devises
  const fromCurrency = getCurrencyForCountry(fromCode) || 'USD';
  const toCurrency = getCurrencyForCountry(toCode) || 'USD';
  
  const scenarioId = `${fromCurrency.toLowerCase()}-${toCurrency.toLowerCase()}`;
  let scenario = scenarios.find(s => s.id === scenarioId);

  // Si le corridor n'existe pas, créer un scénario générique
  if (!scenario) {
    scenario = {
      id: scenarioId,
      from: fromCurrency,
      to: toCurrency,
      amount,
      oracle: { ref: getOracleFX(fromCurrency, toCurrency) }
    };
  }

  const filteredRails = rails.filter(r => kyc ? r.type === 'kyc' : r.type === 'nkyc');

  const IPAYX_FEE = 0.007; // 0.7% frais iPAYX Protocol

  const scoredRails = filteredRails.map((rail, index) => {
    const quoteFX = generateQuoteFX(scenario.oracle.ref, index);
    const totalFeePct = rail.baseFeePct + IPAYX_FEE;
    
    const railInput = {
      name: rail.name,
      feePct: totalFeePct,
      etaMin: rail.latencyMin,
      quoteFX,
      oracleFX: scenario.oracle.ref,
      liq: rail.liq,
      vol: rail.vol,
      status: 'live'
    };
    const score = scoreRail(railInput);
    
    return {
      rail: rail.name,
      score: parseFloat(score.toFixed(2)),
      feePct: totalFeePct,
      etaMin: rail.latencyMin,
      quoteFX: parseFloat(quoteFX.toFixed(4)),
      oracleFX: scenario.oracle.ref,
      fxSpread: parseFloat(Math.abs(quoteFX - scenario.oracle.ref).toFixed(4)),
      liq: rail.liq,
      vol: rail.vol,
      status: 'live'
    };
  });

  const sorted = scoredRails.sort((a, b) => b.score - a.score).slice(0, 3);

  return {
    routes: sorted,
    corridor: `${fromCurrency}-${toCurrency}`,
    amount
  };
}
