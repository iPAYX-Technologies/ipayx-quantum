import { useEffect, useState } from 'react';
import { atlasApi } from '@/services/atlas-api';
import '../atlas/atlas.css';

export const TopStrip = () => {
  const [weather, setWeather] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [weatherRes, marketRes, newsRes] = await Promise.all([
          atlasApi.getWeather(),
          atlasApi.getMarket(),
          atlasApi.getNews()
        ]);

        if (weatherRes.success) setWeather(weatherRes.data);
        if (marketRes.success) setMarket(marketRes.data);
        if (newsRes.success) setNews(newsRes.data);
      } catch (error) {
        console.error('Failed to load widget data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="atlas-topstrip">
      {/* Weather Widget */}
      <div className="atlas-widget">
        <div className="atlas-widget-title">Weather</div>
        {weather ? (
          <div>
            <div className="atlas-widget-value">
              {weather.icon} {weather.temperature}°C
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.7 }}>
              {weather.location}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      {/* Market Widget */}
      <div className="atlas-widget">
        <div className="atlas-widget-title">Markets</div>
        {market ? (
          <div>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: '600' }}>CAD/USD:</span>{' '}
              <span className="atlas-widget-value" style={{ fontSize: '1rem' }}>
                ${market.cadUsd.rate}
              </span>{' '}
              <span style={{ color: market.cadUsd.direction === 'up' ? '#10b981' : '#ef4444' }}>
                {market.cadUsd.change}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ fontWeight: '600' }}>BTC/USDC:</span>{' '}
              <span className="atlas-widget-value" style={{ fontSize: '1rem' }}>
                ${market.btcUsdc.rate.toLocaleString()}
              </span>{' '}
              <span style={{ color: market.btcUsdc.direction === 'up' ? '#10b981' : '#ef4444' }}>
                {market.btcUsdc.change}
              </span>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      {/* News Widget */}
      <div className="atlas-widget" style={{ flex: 1.5 }}>
        <div className="atlas-widget-title">News</div>
        {news.length > 0 ? (
          <div>
            {news.slice(0, 2).map((item, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.1rem' }}>
                  {item.title}
                </div>
                <div style={{ opacity: 0.6 }}>
                  {item.source} • {item.time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
};
