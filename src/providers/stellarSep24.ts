// Stellar provider (SEP-1/24 minimal utilitaire)
// Objectif: découverte anchor via stellar.toml + construction d'URL interactive SEP-24.
// Pas de SEP-10 auth complète ici (sera ajouté plus tard si nécessaire).

export type AssetCode = "USDC" | "EURC" | string;
export type PublicKey = string; // G... address

export type Sep1Toml = {
  WEB_AUTH_ENDPOINT?: string;
  TRANSFER_SERVER_SEP0024?: string;
  KYC_SERVER?: string;
  DOCUMENTATION?: any;
  CURRENCIES?: Array<{ code: string; issuer?: string }>;
  [k: string]: any;
};

function nowIso() {
  return new Date().toISOString();
}

export async function discoverAnchor(homeDomain: string): Promise<Sep1Toml> {
  const url = `https://${homeDomain}/.well-known/stellar.toml`;
  const res = await fetch(url, { headers: { accept: "text/plain" } });
  if (!res.ok) throw new Error(`stellar.toml fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();

  // Parsing ultra-simple: on cherche des lignes clef=valeur
  const lines = text.split(/\r?\n/);
  const out: Sep1Toml = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]+)"?\s*$/i);
    if (m) {
      const k = m[1].trim();
      const v = m[2].trim();
      (out as any)[k] = v;
    }
  }
  return out;
}

export async function quoteSep24(params: {
  homeDomain: string;
  operation: "deposit" | "withdraw";
  assetCode: AssetCode;
  amount: string;
  account?: PublicKey;
}) {
  const toml = await discoverAnchor(params.homeDomain);
  const transfer = toml.TRANSFER_SERVER_SEP0024;
  if (!transfer) throw new Error("Anchor missing TRANSFER_SERVER_SEP0024 in stellar.toml");

  // Beaucoup d'anchors retournent /info pour exposer les assets
  // Ici on renvoie un objet de quote simplifié.
  return {
    source: "stellar",
    operation: params.operation,
    assetCode: params.assetCode,
    amount: params.amount,
    anchor: params.homeDomain,
    transferServer: transfer,
    timestamp: nowIso(),
  };
}

export async function startSep24Interactive(params: {
  homeDomain: string;
  operation: "deposit" | "withdraw";
  assetCode: AssetCode;
  amount: string;
  account: PublicKey; // adresse G...
  email?: string;
}): Promise<{ url: string; note: string }> {
  const toml = await discoverAnchor(params.homeDomain);
  const transfer = toml.TRANSFER_SERVER_SEP0024;
  if (!transfer) throw new Error("Anchor missing TRANSFER_SERVER_SEP0024");

  // SEP-24: construction URL interactive minimale (lang=en par défaut)
  // NB: Pour la production: ajouter SEP-10 auth (WEB_AUTH_ENDPOINT) et token JWT.
  const qs = new URLSearchParams({
    asset_code: params.assetCode,
    account: params.account,
    amount: params.amount,
    type: params.operation,
    lang: "en",
  });
  const url = `${transfer}/transactions/interactive?${qs.toString()}`;
  return { url, note: "Visiter l'URL pour compléter KYC/flow SEP-24 (JWT SEP-10 recommandé en prod)." };
}
