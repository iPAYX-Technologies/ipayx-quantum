import { supabase } from "@/integrations/supabase/client";
import railsData from "@/data/rails.json";

/**
 * Lit les données statiques du backend GitHub via le proxy
 * Remplace temporairement les appels à backend-api.ts jusqu'au déploiement Railway
 */
export const githubBackend = {
  /**
   * Lire les rails configurés (données locales)
   */
  getRails: async () => {
    console.log('✅ Loading rails from local data...');
    return railsData;
  },

  /**
   * Lire les scénarios configurés
   */
  getScenarios: async () => {
    try {
      console.log('🔄 Calling proxy-github for scenarios.json...');
      
      // Phase 1: Add 3-second timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
      );

      const { data, error } = await Promise.race([
        supabase.functions.invoke('proxy-github', {
          body: { endpoint: 'src/data/scenarios.json' }
        }),
        timeoutPromise
      ]) as any;

      console.log('📦 Proxy response:', { data, error });

      if (error) {
        console.error('❌ Supabase invoke error:', error);
        throw error;
      }

      if (!data || !data.content) {
        console.error('❌ No content in response:', data);
        throw new Error('Empty response from proxy');
      }

      const content = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content;

      console.log('✅ Parsed scenarios:', content);
      return content;
    } catch (err) {
      console.error('Error fetching scenarios from GitHub:', err);
      throw err;
    }
  },

  /**
   * Lire le fichier SUMMARY (architecture complète)
   */
  getSummary: async () => {
    try {
      console.log('🔄 Calling proxy-github for SUMMARY_IPAYX.md...');
      
      // Phase 1: Add 3-second timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
      );

      const { data, error } = await Promise.race([
        supabase.functions.invoke('proxy-github', {
          body: { endpoint: 'SUMMARY_IPAYX.md' }
        }),
        timeoutPromise
      ]) as any;

      console.log('📦 Proxy response:', { data, error });

      if (error) {
        console.error('❌ Supabase invoke error:', error);
        throw error;
      }

      if (!data || !data.content) {
        console.error('❌ No content in response:', data);
        throw new Error('Empty response from proxy');
      }

      console.log('✅ Parsed summary');
      return data.content;
    } catch (err) {
      console.error('Error fetching summary from GitHub:', err);
      throw err;
    }
  },

  /**
   * Get FX rate from edge function
   */
  getFXRate: async (base: string, dest: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('fx-rates', {
        body: { base, dest }
      });
      
      if (error) throw error;
      return data.rate || 1.35; // Fallback
    } catch (err) {
      console.warn('FX rate fetch failed, using default:', err);
      return 1.35;
    }
  },

  /**
   * Get digital asset prices from crypto-prices (Chainlink)
   */
  getDigitalAssetPrices: async (assets: string[]): Promise<Record<string, any>> => {
    try {
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { assets }
      });
      
      if (error) throw error;
      return data || {};
    } catch (err) {
      console.warn('Digital asset prices fetch failed:', err);
      return {};
    }
  },

  /**
   * Call real iPAYX Python backend Meta-Router
   * Uses Chainlink CCIP, Circle CCTP, Stellar SEP-24, etc.
   */
  simulateMetaRouter: async (params: {
    fromNetwork: string;
    toNetwork: string;
    asset: string;
    amount: number;
  }) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.ipayx-protocol.com';
      
      console.log('🔗 Calling iPAYX Python backend Meta-Router...');
      
      const response = await fetch(`${backendUrl}/meta-router/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNetwork: params.fromNetwork,
          toNetwork: params.toNetwork,
          asset: params.asset,
          amount: params.amount
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ Backend returned ${response.status}, falling back to local simulation`);
        // Fallback to local simulation
        return await githubBackend.fallbackSimulation(params);
      }

      const data = await response.json();
      console.log('✅ Backend response:', data);
      
      return data;
    } catch (err) {
      console.error('❌ Error calling backend, using fallback:', err);
      return await githubBackend.fallbackSimulation(params);
    }
  },

  /**
   * Fallback simulation using local rails.json if backend is unavailable
   */
  fallbackSimulation: async (params: {
    fromNetwork: string;
    toNetwork: string;
    asset: string;
    amount: number;
  }) => {
    console.log('🔄 Using local fallback simulation...');
    const rails = await githubBackend.getRails();
    
    // Fetch real FX rate
    const oracleFX = await githubBackend.getFXRate(params.fromNetwork, params.toNetwork);
    
    // Fetch digital asset prices for volatility
    const assetPrices = await githubBackend.getDigitalAssetPrices(['USDC', 'USDT', 'XLM']);

    // Score each rail
    const routes = rails.map((rail: any) => {
      const quoteFX = oracleFX + (Math.random() - 0.5) * 0.02;
      const fxSpread = Math.abs(quoteFX - oracleFX);
      const vol = assetPrices[rail.asset]?.volatility || rail.vol;

      return {
        rail: rail.name,
        provider: rail.provider,
        score: (95 - Math.random() * 15).toFixed(1),
        feePct: rail.baseFeePct,
        etaMin: rail.latencyMin,
        quoteFX: parseFloat(quoteFX.toFixed(4)),
        oracleFX: parseFloat(oracleFX.toFixed(4)),
        fxSpread: (fxSpread * 100).toFixed(1) + '%',
        liq: rail.liq,
        vol,
        status: "available",
        amount: params.amount,
        amountOut: parseFloat((params.amount * (1 - rail.baseFeePct / 100) * quoteFX).toFixed(2))
      };
    });

    routes.sort((a: any, b: any) => parseFloat(b.score) - parseFloat(a.score));

    return {
      routes,
      fromNetwork: params.fromNetwork,
      toNetwork: params.toNetwork,
      asset: params.asset,
      amount: params.amount
    };
  },

  /**
   * Lire les vrais partenaires depuis Ipayx-protocol monorepo
   * Phase 2: Return local data immediately for fast loading
   */
  getPartners: async () => {
    console.log('⚡ Using local rails.json (fast mode)');
    return railsData;
  }
};
