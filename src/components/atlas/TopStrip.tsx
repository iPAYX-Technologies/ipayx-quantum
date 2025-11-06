import React, { useEffect, useState } from 'react';
import { Cloud, TrendingUp, Newspaper } from 'lucide-react';

// DRY_RUN stub data
const STUB_DATA = {
  weather: {
    city: 'Montréal',
    temp: '12°C',
    condition: 'Partly Cloudy'
  },
  markets: {
    cadUsd: { rate: '0.7234', change: '+0.12%' },
    btcUsdc: { rate: '43,250', change: '+2.34%' }
  },
  news: [
    'CAD strengthens against USD',
    'USDC adoption grows 15%',
    'Cross-border payments surge'
  ]
};

export default function TopStrip() {
  const [data, setData] = useState(STUB_DATA);
  const isDryRun = import.meta.env.VITE_DRY_RUN !== 'false';

  useEffect(() => {
    // In DRY_RUN mode, always use stub data
    if (isDryRun) {
      setData(STUB_DATA);
    }
  }, [isDryRun]);

  return (
    <div className="atlas-top-strip">
      {/* Weather Widget */}
      <div className="atlas-widget">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cloud size={16} />
          <span style={{ fontWeight: 600 }}>{data.weather.city}</span>
          <span style={{ opacity: 0.7 }}>
            {data.weather.temp} • {data.weather.condition}
          </span>
        </div>
      </div>

      {/* Markets Widget */}
      <div className="atlas-widget">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} />
          <span style={{ fontWeight: 600 }}>Markets</span>
          <span style={{ opacity: 0.7 }}>
            CAD/USD: {data.markets.cadUsd.rate} ({data.markets.cadUsd.change})
          </span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ opacity: 0.7 }}>
            BTC/USDC: ${data.markets.btcUsdc.rate} ({data.markets.btcUsdc.change})
          </span>
        </div>
      </div>

      {/* News Widget */}
      <div className="atlas-widget" style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Newspaper size={16} />
          <span style={{ fontWeight: 600 }}>News</span>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            {data.news.map((item, idx) => (
              <span key={idx} style={{ opacity: 0.7 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
