import { useState, useEffect } from 'react';
import { atlasApi } from '@/services/atlas-api';
import { toast } from 'sonner';
import '../atlas/atlas.css';

interface Quote {
  provider: string;
  feePct: number;
  spreadPct: number;
  eta: string;
  route: string;
  totalCost: number;
  rate: number;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

interface CompareRatesProps {
  onInjectRoute?: (quote: Quote) => void;
}

export const CompareRates = ({ onInjectRoute }: CompareRatesProps) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(32000);
  const [fromCurrency] = useState('CAD');
  const [toCurrency] = useState('PKR');
  const [toCountry] = useState('Pakistan');

  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      const response = await atlasApi.getQuote({
        amount,
        fromCurrency,
        toCurrency,
        toCountry
      });
      
      if (response.success) {
        setQuotes(response.quotes);
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleSimulate = (quote: Quote) => {
    onInjectRoute?.(quote);
    // Show toast notification
    toast.success('Best route injected into Send Money', {
      description: `${quote.provider}: ${quote.route}\nFee: ${quote.feePct}% + Spread: ${quote.spreadPct}%\nTotal Cost: $${quote.totalCost}`,
      duration: 5000
    });
  };

  const getBestQuote = () => {
    if (quotes.length === 0) return null;
    return quotes.reduce((best, current) => 
      current.totalCost < best.totalCost ? current : best
    );
  };

  const bestQuote = getBestQuote();

  return (
    <div className="atlas-table">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Compare Rates
          </h3>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Comparing {amount.toLocaleString()} {fromCurrency} → {toCurrency}
          </p>
        </div>
        <button
          className="atlas-button"
          onClick={loadQuotes}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
          Loading quotes...
        </div>
      ) : quotes.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Fee</th>
              <th>Spread</th>
              <th>Rate</th>
              <th>Total Cost</th>
              <th>ETA</th>
              <th>Route</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, idx) => (
              <tr key={idx} style={{
                background: quote === bestQuote 
                  ? 'rgba(0, 255, 209, 0.1)' 
                  : 'transparent'
              }}>
                <td>
                  <strong>{quote.provider}</strong>
                  {quote === bestQuote && (
                    <span style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      background: 'var(--atlas-accent)',
                      color: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontWeight: '600'
                    }}>
                      BEST
                    </span>
                  )}
                </td>
                <td>{quote.feePct}%</td>
                <td>{quote.spreadPct}%</td>
                <td>{quote.rate.toFixed(2)}</td>
                <td>
                  <strong>${quote.totalCost.toFixed(2)}</strong>
                </td>
                <td>{quote.eta}</td>
                <td style={{ fontSize: '0.875rem' }}>
                  {quote.route}
                </td>
                <td>
                  <button
                    className="atlas-button"
                    onClick={() => handleSimulate(quote)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Simulate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
          No quotes available
        </div>
      )}

      <div style={{ 
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(0, 127, 255, 0.1)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          📊 Rate Comparison Notes:
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', opacity: 0.8 }}>
          <li>NDAX: Low fees, good spread, fast execution (2-4 hours)</li>
          <li>Cybrid: Quote-only mode, competitive rates (1-2 hours)</li>
          <li>Bank Wire: Higher fees, 1-day hold period</li>
        </ul>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
          🔒 DRY_RUN mode - All rates are simulated
        </div>
      </div>
    </div>
  );
};
