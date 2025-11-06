import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { LeftNav } from './atlas/LeftNav';
import { TopStrip } from './atlas/TopStrip';
import { ChatRail } from './atlas/ChatRail';
import { SmartRoutingMemory } from './atlas/SmartRoutingMemory';
import { CompareRates } from './atlas/CompareRates';
import './atlas/atlas.css';

const Atlas = () => {
  const [activeSection, setActiveSection] = useState('send-money');
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  const handleQuoteInjection = (quote: any) => {
    setSelectedQuote(quote);
    setActiveSection('send-money');
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'send-money':
        return (
          <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
            <div style={{ flex: '0 0 30%' }}>
              <div className="atlas-surface" style={{ padding: '1.5rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Send Money
                </h3>
                
                {selectedQuote && (
                  <div style={{
                    background: 'rgba(0, 255, 209, 0.2)',
                    border: '2px solid var(--atlas-accent)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      ✨ Best Route Injected
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      {selectedQuote.provider}: {selectedQuote.route}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Amount (CAD)
                  </label>
                  <input
                    type="number"
                    className="atlas-chat-input"
                    defaultValue={32000}
                    style={{ marginBottom: '0rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Recipient Country
                  </label>
                  <select className="atlas-chat-input" style={{ marginBottom: '0rem' }}>
                    <option>Pakistan</option>
                    <option>India</option>
                    <option>Philippines</option>
                    <option>Mexico</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Recipient Details
                  </label>
                  <input
                    type="text"
                    className="atlas-chat-input"
                    placeholder="Name or identifier"
                    style={{ marginBottom: '0rem' }}
                  />
                </div>

                <button className="atlas-button" style={{ width: '100%', marginTop: '1rem' }}>
                  Calculate Best Route 🚀
                </button>

                <SmartRoutingMemory />
              </div>
            </div>
            
            <div style={{ flex: '1' }}>
              <ChatRail />
            </div>
          </div>
        );

      case 'compare-rates':
        return <CompareRates onInjectRoute={handleQuoteInjection} />;

      case 'recent-transfers':
        return (
          <div className="atlas-surface" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Recent Transfers
            </h3>
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              opacity: 0.6 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                No transfers yet
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Your transfer history will appear here (DRY_RUN mode)
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="atlas-surface" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Settings / Security
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>
                🔐 Security Settings
              </h4>
              <div style={{ 
                padding: '1rem',
                background: 'rgba(0, 127, 255, 0.1)',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Two-Factor Authentication:</strong> Not configured
                </div>
                <button className="atlas-button" style={{ fontSize: '0.875rem' }}>
                  Enable 2FA
                </button>
              </div>
              
              <div style={{ 
                padding: '1rem',
                background: 'rgba(0, 127, 255, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Sign In:</strong> Demo mode
                </div>
                <button className="atlas-button" style={{ fontSize: '0.875rem' }} disabled>
                  Sign In (Non-functional)
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>
                ⚙️ Preferences
              </h4>
              <div style={{ 
                padding: '1rem',
                background: 'rgba(0, 127, 255, 0.1)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Default Currency:</strong> CAD
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Language:</strong> English
                </div>
                <div>
                  <strong>Notifications:</strong> Enabled
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <strong>⚠️ DRY_RUN Mode Active</strong>
              <div style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                Settings and security features are non-functional in demo mode.
                No real authentication or data storage.
              </div>
            </div>
          </div>
        );

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Quantum Atlas - iPayX Payments Hub</title>
        <meta name="description" content="Atlas-style UI for global payments and transfers with Smart Routing Memory" />
      </Helmet>

      <div className="atlas-container">
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          padding: '1.5rem',
          minHeight: '100vh'
        }}>
          {/* Left Navigation */}
          <LeftNav onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Top Strip */}
            <TopStrip />

            {/* Content */}
            <div style={{ flex: 1 }}>
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Atlas;
