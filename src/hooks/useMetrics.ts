import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  volume24h: number;
  activeRoutes: number;
  onramps: number;
  avgFxSpread: number;
}

export function useMetrics(refreshInterval = 30000) {
  const [metrics, setMetrics] = useState<Metrics>({
    volume24h: 0,
    activeRoutes: 0,
    onramps: 0,
    avgFxSpread: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        
        const endpoints = ['volume24h', 'activeRoutes', 'onramps', 'avgFxSpread'];
        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            const { data, error } = await supabase.functions.invoke(`metrics/${endpoint}`);
            if (error) throw error;
            return data;
          })
        );
        
        setMetrics({
          volume24h: results[0]?.value || 0,
          activeRoutes: results[1]?.value || 0,
          onramps: results[2]?.value || 0,
          avgFxSpread: results[3]?.bps || 0
        });
        
        setError(null);
      } catch (err: any) {
        console.error('Failed to load metrics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { metrics, loading, error };
}
