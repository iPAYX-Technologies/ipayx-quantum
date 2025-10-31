// Paychant On/Off Ramp Integration
// For African rails: Mobile Money, USSD, Bank Transfer, USDC/USDT

export interface PaychantConfig {
  action: 'buy' | 'sell';
  asset: string; // ex: "usdc_stellar", "usdt_tron"
  amount?: string;
  destinationAddress?: string;
}

export const openPaychantWidget = (config: PaychantConfig) => {
  const apiKey = import.meta.env.VITE_PAYCHANT_PARTNER_API_KEY;
  
  if (!apiKey) {
    console.error('⚠️ VITE_PAYCHANT_PARTNER_API_KEY is missing');
    throw new Error('Paychant API key not configured');
  }

  const logo = "https://ipayx.ai/ipayx-logo-new.png";
  const color = encodeURIComponent("#0052FF"); // iPayX primary color

  const params = new URLSearchParams({
    partnerApiKey: apiKey,
    partnerLogoUrl: logo,
    partnerThemeColor: color,
    selectedAsset: config.asset,
  });

  if (config.amount) {
    params.append('amount', config.amount);
  }

  if (config.destinationAddress) {
    params.append('destinationAddress', config.destinationAddress);
  }

  const url = `https://widget.paychant.com/${config.action}?${params.toString()}`;

  // Open in popup window (better UX than new tab)
  const width = 480;
  const height = 720;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  window.open(
    url,
    'PaychantWidget',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  );
};

export const PAYCHANT_ASSETS = {
  USDC_STELLAR: 'usdc_stellar',
  USDT_TRON: 'usdt_tron',
  USDC_POLYGON: 'usdc_polygon',
  USDT_BSC: 'usdt_bsc',
} as const;
