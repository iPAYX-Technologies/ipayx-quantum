/**
 * iPAYX Protocol - Oracle Pricing Layer
 * Chainlink (primary) + Pyth (fallback)
 */

export type FxQuote = {
  base: 'USD';
  quote: string;
  rate: number;
  source: 'chainlink' | 'pyth';
  timestamp: number;
};

export type AssetPrice = {
  asset: string;
  price: number;
  source: 'chainlink' | 'pyth';
  timestamp: number;
};

const DEVIATION_THRESHOLD_BPS = 50; // 0.5%
const STALENESS_THRESHOLD_MS = 60000; // 60 seconds

/**
 * Get USD/FX rate (primary: Chainlink, fallback: Pyth)
 */
export async function getUsdFx(quote: string): Promise<FxQuote> {
  try {
    // Try Chainlink first
    const chainlinkRate = await getChainlinkFx(quote);
    if (chainlinkRate) {
      return {
        base: 'USD',
        quote,
        rate: chainlinkRate,
        source: 'chainlink',
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.warn('Chainlink FX failed, trying Pyth fallback:', error);
  }

  // Fallback to Pyth
  const pythRate = await getPythFx(quote);
  if (!pythRate) {
    throw new Error(`No FX rate available for USD/${quote}`);
  }

  return {
    base: 'USD',
    quote,
    rate: pythRate,
    source: 'pyth',
    timestamp: Date.now()
  };
}

/**
 * Get asset price in USD (primary: Chainlink, fallback: Pyth)
 */
export async function getAssetUsdPrice(
  asset: 'ETH' | 'BTC' | 'SOL' | 'USDC' | 'USDT' | string
): Promise<AssetPrice> {
  // Stablecoins = 1 USD
  if (asset === 'USDC' || asset === 'USDT') {
    return {
      asset,
      price: 1.0,
      source: 'chainlink',
      timestamp: Date.now()
    };
  }

  try {
    // Try Chainlink first
    const chainlinkPrice = await getChainlinkPrice(asset);
    if (chainlinkPrice) {
      return {
        asset,
        price: chainlinkPrice,
        source: 'chainlink',
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.warn('Chainlink price failed, trying Pyth fallback:', error);
  }

  // Fallback to Pyth
  const pythPrice = await getPythPrice(asset);
  if (!pythPrice) {
    throw new Error(`No price available for ${asset}/USD`);
  }

  return {
    asset,
    price: pythPrice,
    source: 'pyth',
    timestamp: Date.now()
  };
}

/**
 * Validate deviation between primary and fallback
 */
export function validateDeviation(primary: number, fallback: number): boolean {
  const deviation = Math.abs(primary - fallback) / primary;
  const deviationBps = deviation * 10000;
  
  if (deviationBps > DEVIATION_THRESHOLD_BPS) {
    console.error(`Price deviation too high: ${deviationBps.toFixed(2)} bps (threshold: ${DEVIATION_THRESHOLD_BPS})`);
    return false;
  }
  
  return true;
}

/**
 * Chainlink FX rate via public RPC
 * Price feeds: https://docs.chain.link/data-feeds/price-feeds/addresses
 */
async function getChainlinkFx(quote: string): Promise<number | null> {
  // Chainlink USD/FX aggregator addresses on Ethereum mainnet
  const feedAddresses: Record<string, string> = {
    'CAD': '0xa34317DB73e77d453b1B8d04550c44D10e981C8e', // USD/CAD
    'EUR': '0xb49f677943BC038e9857d61E7d053CaA2C1734C1', // EUR/USD
    'GBP': '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5', // GBP/USD
    'JPY': '0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3', // USD/JPY
    'AUD': '0x77F9710E7d0A19669A13c055F62cd80d313dF022', // AUD/USD
  };

  const aggregatorAddress = feedAddresses[quote];
  if (!aggregatorAddress) return null;

  try {
    // Call Chainlink aggregator's latestRoundData() via Ethereum RPC
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: aggregatorAddress,
          data: '0xfeaf968c' // latestRoundData() function selector
        }, 'latest']
      })
    });

    const result = await response.json();
    if (result.error || !result.result) return null;

    // Parse answer (2nd return value, int256, 8 decimals for USD pairs)
    const hex = result.result.slice(0, 130); // First 64 bytes contain roundId + answer
    const answerHex = '0x' + hex.slice(66, 130);
    const answer = parseInt(answerHex, 16);
    
    // Convert based on pair direction
    if (quote === 'EUR' || quote === 'GBP' || quote === 'AUD') {
      // These are XXX/USD, so we need to invert for USD/XXX
      return 1 / (answer / 1e8);
    } else {
      // USD/XXX pairs
      return answer / 1e8;
    }
  } catch (error) {
    console.error(`Chainlink FX error for ${quote}:`, error);
    return null;
  }
}

/**
 * Pyth FX rate (fallback) via Hermes API
 * Price IDs: https://pyth.network/developers/price-feed-ids
 */
async function getPythFx(quote: string): Promise<number | null> {
  // Pyth price feed IDs for USD/FX pairs
  const priceIds: Record<string, string> = {
    'CAD': 'e13b1c1ffb32f34e1be9545583f01ef385fde7f42ee66049d30570dc866b77ca', // USD/CAD
    'EUR': 'a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b', // EUR/USD
    'GBP': '84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1', // GBP/USD
    'JPY': 'ef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52', // USD/JPY
    'BRL': '99e23c0e8953c24e71f91ea5c4e1e7ff13e56b37be6b1b28e8a69aaa7f387735', // USD/BRL
  };

  const priceId = priceIds[quote];
  if (!priceId) return null;

  try {
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceId}`);
    const data = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) return null;
    
    const priceData = data.parsed[0].price;
    const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
    
    // Invert if needed (same logic as Chainlink)
    if (quote === 'EUR' || quote === 'GBP') {
      return 1 / price;
    }
    return price;
  } catch (error) {
    console.error(`Pyth FX error for ${quote}:`, error);
    return null;
  }
}

/**
 * Chainlink asset price via public RPC
 */
async function getChainlinkPrice(asset: string): Promise<number | null> {
  const feedAddresses: Record<string, string> = {
    'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
    'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // BTC/USD
    'SOL': '0x4ffC43a60e009B551865A93d232E33Fce9f01507', // SOL/USD
  };

  const aggregatorAddress = feedAddresses[asset];
  if (!aggregatorAddress) return null;

  try {
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: aggregatorAddress,
          data: '0xfeaf968c'
        }, 'latest']
      })
    });

    const result = await response.json();
    if (result.error || !result.result) return null;

    const hex = result.result.slice(0, 130);
    const answerHex = '0x' + hex.slice(66, 130);
    const answer = parseInt(answerHex, 16);
    
    return answer / 1e8; // 8 decimals for USD pairs
  } catch (error) {
    console.error(`Chainlink price error for ${asset}:`, error);
    return null;
  }
}

/**
 * Pyth asset price (fallback)
 */
async function getPythPrice(asset: string): Promise<number | null> {
  const priceIds: Record<string, string> = {
    'ETH': 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
    'BTC': 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
    'SOL': 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD
  };

  const priceId = priceIds[asset];
  if (!priceId) return null;

  try {
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceId}`);
    const data = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) return null;
    
    const priceData = data.parsed[0].price;
    return parseFloat(priceData.price) * Math.pow(10, priceData.expo);
  } catch (error) {
    console.error(`Pyth price error for ${asset}:`, error);
    return null;
  }
}
