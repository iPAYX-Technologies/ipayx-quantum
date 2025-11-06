import React, { useState } from 'react';
import LeftNav from '@/components/atlas/LeftNav';
import TopStrip from '@/components/atlas/TopStrip';
import ChatRail from '@/components/atlas/ChatRail';
import '@/styles/atlas.css';
import { TrendingUp, Clock, Settings, Send } from 'lucide-react';

// Mock data for Compare Rates
const MOCK_PROVIDERS = [
  {
    name: 'NDAX',
    feePct: '0.20%',
    spreadPct: '~0.25%',
    eta: '2-4 hours',
    route: 'NDAX→USDC→Circle',
    totalCost: '0.45%'
  },
  {
    name: 'Cybrid',
    feePct: 'Quote-only',
    spreadPct: 'Variable',
    eta: '1-3 hours',
    route: 'Cybrid API',
    totalCost: 'TBD'
  },
  {
    name: 'Bank Wire',
    feePct: '$25-50',
    spreadPct: '2-3%',
    eta: '1-3 days',
    route: 'SWIFT/Wire',
    totalCost: '2-3% + fee'
  }
];

export default function Atlas() {
  const [activeTab, setActiveTab] = useState('send-money');
  const [sendMoneyData, setSendMoneyData] = useState<any>(null);

  const handleSimulateRoute = (provider: typeof MOCK_PROVIDERS[0]) => {
    setSendMoneyData({
      provider: provider.name,
      route: provider.route,
      fee: provider.feePct,
      spread: provider.spreadPct,
      eta: provider.eta
    });
    setActiveTab('send-money');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'send-money':
        return (
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: 'var(--atlas-text-dark)'
            }}>
              Send Money
            </h1>
            {sendMoneyData && (
              <div className="atlas-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div className="atlas-memory-indicator">
                    ✨ Smart Route Selected
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Provider:</span> {sendMoneyData.provider}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Route:</span> {sendMoneyData.route}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Fee:</span> {sendMoneyData.fee}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Spread:</span> {sendMoneyData.spread}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>ETA:</span> {sendMoneyData.eta}
                  </div>
                </div>
              </div>
            )}
            <ChatRail />
          </div>
        );
      
      case 'compare-rates':
        return (
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: 'var(--atlas-text-dark)'
            }}>
              Compare Rates
            </h1>
            <div className="atlas-card">
              <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
                Compare provider fees and routes for international transfers
              </p>
              <table className="atlas-rates-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Fee</th>
                    <th>Spread</th>
                    <th>ETA</th>
                    <th>Route</th>
                    <th>Total Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PROVIDERS.map((provider, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{provider.name}</td>
                      <td>{provider.feePct}</td>
                      <td>{provider.spreadPct}</td>
                      <td>{provider.eta}</td>
                      <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {provider.route}
                      </td>
                      <td style={{ fontWeight: 600 }}>{provider.totalCost}</td>
                      <td>
                        <button
                          className="atlas-button"
                          style={{ 
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem'
                          }}
                          onClick={() => handleSimulateRoute(provider)}
                        >
                          Simulate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ 
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'var(--atlas-surface)',
                borderRadius: 'var(--atlas-radius-md)',
                fontSize: '0.875rem'
              }}>
                <strong>Note:</strong> All rates are simulated for DRY_RUN mode. 
                Click "Simulate" to inject the selected route into Send Money.
              </div>
            </div>
          </div>
        );
      
      case 'recent-transfers':
        return (
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: 'var(--atlas-text-dark)'
            }}>
              Recent Transfers
            </h1>
            <div className="atlas-card">
              <div style={{ 
                textAlign: 'center', 
                padding: '4rem 2rem',
                opacity: 0.5 
              }}>
                <Clock size={48} style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  No transfers yet
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Your transfer history will appear here
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              marginBottom: '1rem',
              color: 'var(--atlas-text-dark)'
            }}>
              Settings / Security
            </h1>
            <div className="atlas-card">
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Account Settings
                </h3>
                <div style={{ 
                  padding: '1rem',
                  background: 'var(--atlas-surface)',
                  borderRadius: 'var(--atlas-radius-md)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    Sign in to manage your account settings
                  </p>
                  <button 
                    className="atlas-button"
                    style={{ marginTop: '1rem' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Security
                </h3>
                <div style={{ 
                  padding: '1rem',
                  background: 'var(--atlas-surface)',
                  borderRadius: 'var(--atlas-radius-md)'
                }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    🔒 All transactions are secured with end-to-end encryption
                  </p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>
                    DRY_RUN mode: No real authentication or network calls
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <ChatRail />;
    }
  };

  return (
    <div className="atlas-container">
      <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />
      <TopStrip />
      <main className="atlas-main">
        {renderContent()}
      </main>
    </div>
  );
}
