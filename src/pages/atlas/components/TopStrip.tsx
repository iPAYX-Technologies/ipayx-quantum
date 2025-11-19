/**
 * TopStrip - Widget Bar Component
 * 
 * Displays widgets for:
 * - Weather (Montréal)
 * - Markets (FX CAD/USD + BTC/USDC)
 * - News (3 items)
 */

import { useEffect, useState } from 'react';
import { Cloud, TrendingUp, TrendingDown, Newspaper } from 'lucide-react';
import { getWeatherWidget, getMarketWidget, getNewsWidget } from '@/services/atlas-api';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
}

interface MarketPair {
  pair: string;
  rate: number;
  change: string;
  trend: 'up' | 'down';
}

interface MarketData {
  pairs: MarketPair[];
}

interface NewsItem {
  title: string;
  time: string;
}

interface NewsData {
  items: NewsItem[];
}

export const TopStrip = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [markets, setMarkets] = useState<MarketData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      const [weatherData, marketsData, newsData] = await Promise.all([
        getWeatherWidget(),
        getMarketWidget(),
        getNewsWidget(),
      ]);
      setWeather(weatherData);
      setMarkets(marketsData);
      setNews(newsData);
    } catch (error) {
      console.error('Failed to load widgets:', error);
    }
  };

  return (
    <div className="atlas-glass-surface-light p-4">
      <div className="flex gap-6 items-center overflow-x-auto atlas-scrollbar">
        {/* Weather Widget */}
        {weather && (
          <div className="atlas-widget flex items-center gap-3 min-w-fit">
            <Cloud size={24} className="text-blue-500" />
            <div>
              <div className="text-sm font-medium">{weather.location}</div>
              <div className="text-xs atlas-text-secondary">
                {weather.temperature}°C • {weather.condition}
              </div>
            </div>
          </div>
        )}

        {/* Markets Widget */}
        {markets && (
          <div className="atlas-widget min-w-fit">
            <div className="text-xs font-semibold atlas-text-secondary mb-2">Markets</div>
            <div className="space-y-1">
              {markets.pairs.map((pair, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{pair.pair}</span>
                  <span className="atlas-text-secondary">{pair.rate.toLocaleString()}</span>
                  <span className={`text-xs flex items-center gap-1 ${
                    pair.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pair.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {pair.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Widget */}
        {news && (
          <div className="atlas-widget flex items-start gap-3 min-w-[300px]">
            <Newspaper size={24} className="text-indigo-500 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="text-xs font-semibold atlas-text-secondary mb-2">Latest News</div>
              {news.items.slice(0, 2).map((item, idx: number) => (
                <div key={idx} className="text-xs">
                  <div className="font-medium atlas-text-primary line-clamp-1">{item.title}</div>
                  <div className="atlas-text-secondary">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopStrip;
