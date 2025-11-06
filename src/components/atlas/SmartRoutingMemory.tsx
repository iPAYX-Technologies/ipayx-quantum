import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle } from 'lucide-react';

interface SmartRoute {
  country: string;
  recipient: string;
  method: string;
  amount: string;
  currency: string;
  timestamp: number;
}

interface SmartRoutingMemoryProps {
  onRouteRecall?: (route: SmartRoute) => void;
}

export default function SmartRoutingMemory({ onRouteRecall }: SmartRoutingMemoryProps) {
  const [routes, setRoutes] = useState<SmartRoute[]>([]);
  const STORAGE_KEY = 'ipayx.smartRoutes';

  useEffect(() => {
    // Load routes from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRoutes(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse smart routes:', e);
        setRoutes([]);
      }
    }
  }, []);

  const saveRoute = (country: string, recipient: string, amount: string, currency: string) => {
    const newRoute: SmartRoute = {
      country,
      recipient,
      method: 'NDAX→USDC→Circle',
      amount,
      currency,
      timestamp: Date.now()
    };

    const updatedRoutes = [newRoute, ...routes.filter(r => r.country !== country).slice(0, 9)];
    setRoutes(updatedRoutes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutes));
  };

  const getRouteForCountry = (country: string): SmartRoute | null => {
    return routes.find(r => r.country.toLowerCase() === country.toLowerCase()) || null;
  };

  // Expose methods to parent component via callback
  useEffect(() => {
    (window as any).smartRoutingMemory = {
      saveRoute,
      getRouteForCountry
    };
  }, [routes]);

  return (
    <div style={{ marginTop: '1rem' }}>
      {routes.length > 0 && (
        <div className="atlas-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Brain size={16} style={{ color: 'var(--atlas-accent)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Smart Routing Memory™
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            {routes.length} {routes.length === 1 ? 'route' : 'routes'} remembered
          </div>
          {routes.slice(0, 3).map((route, idx) => (
            <div 
              key={idx} 
              style={{ 
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'var(--atlas-surface)',
                borderRadius: 'var(--atlas-radius-sm)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => onRouteRecall?.(route)}
            >
              <CheckCircle size={12} style={{ color: 'var(--atlas-accent)' }} />
              <span style={{ fontWeight: 600 }}>{route.country}</span>
              <span style={{ opacity: 0.6 }}>→</span>
              <span style={{ opacity: 0.7 }}>{route.recipient}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span style={{ opacity: 0.7 }}>{route.amount} {route.currency}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
