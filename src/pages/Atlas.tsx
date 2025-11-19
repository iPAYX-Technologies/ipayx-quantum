/**
 * Atlas Page - Main Payment Interface
 * 
 * Quantum Atlas UI with Smart Routing Memory™
 * DRY_RUN mode - No real network calls
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import LeftNav from './atlas/components/LeftNav';
import TopStrip from './atlas/components/TopStrip';
import ChatRail from './atlas/components/ChatRail';
import './atlas/styles/atlas.css';
import { getPaymentQuotes, QuoteProvider, submitPayment } from '@/services/atlas-api';
import { AlertCircle, Check, TrendingUp, Clock, DollarSign } from 'lucide-react';

const Atlas = () => {
  const [activeSection, setActiveSection] = useState('send-money');
  const [quotes, setQuotes] = useState<QuoteProvider[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    country: '',
    route: '',
  });

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleSendMoneyRequest = (data: { amount?: number; country?: string; route?: string }) => {
    setPaymentData({
      amount: data.amount?.toString() || '',
      country: data.country || '',
      route: data.route || '',
    });
    setActiveSection('send-money');
  };

  const loadQuotes = async () => {
    if (!paymentData.amount || !paymentData.country) return;

    setLoadingQuotes(true);
    try {
      const quotesData = await getPaymentQuotes(
        parseFloat(paymentData.amount),
        'CAD',
        'USDC',
        paymentData.country
      );
      setQuotes(quotesData);
      setActiveSection('compare-rates');
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSimulateRoute = (provider: QuoteProvider) => {
    setPaymentData(prev => ({
      ...prev,
      route: provider.route,
    }));
    setActiveSection('send-money');
  };

  const handleSubmitPayment = async () => {
    try {
      const result = await submitPayment(paymentData);
      alert(`Success! Transaction ID: ${result.transactionId}\n\n${result.message}`);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment submission failed. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Quantum Atlas - iPayX Payment Assistant</title>
        <meta name="description" content="Smart cross-border payment routing with Atlas UI" />
      </Helmet>

      <div className="atlas-container">
        <div className="flex h-screen">
          {/* Left Navigation - 20% */}
          <div className="w-1/5 min-w-[240px] p-4">
            <LeftNav activeSection={activeSection} onSectionChange={handleSectionChange} />
          </div>

          {/* Main Content Area - 80% */}
          <div className="flex-1 flex flex-col p-4 gap-4">
            {/* Top Strip */}
            <TopStrip />

            {/* Main Content */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Content Panel - 30% */}
              <div className="w-[30%] atlas-glass-surface p-6 overflow-y-auto atlas-scrollbar">
                {activeSection === 'send-money' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold atlas-text-primary">Send Money</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium atlas-text-primary mb-2">
                          Amount (CAD)
                        </label>
                        <input
                          type="number"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="32,000"
                          className="atlas-input w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium atlas-text-primary mb-2">
                          Destination Country
                        </label>
                        <input
                          type="text"
                          value={paymentData.country}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Pakistan"
                          className="atlas-input w-full"
                        />
                      </div>

                      {paymentData.route && (
                        <div className="atlas-surface-light p-4 rounded-lg">
                          <div className="text-sm font-medium atlas-text-primary mb-1">
                            Selected Route
                          </div>
                          <div className="text-sm atlas-text-secondary">{paymentData.route}</div>
                        </div>
                      )}

                      <button
                        onClick={loadQuotes}
                        disabled={!paymentData.amount || !paymentData.country || loadingQuotes}
                        className="atlas-button-secondary w-full"
                      >
                        {loadingQuotes ? 'Loading...' : 'Compare Rates'}
                      </button>

                      <button
                        onClick={handleSubmitPayment}
                        disabled={!paymentData.amount || !paymentData.country}
                        className="atlas-button-primary w-full"
                      >
                        Submit Payment
                      </button>
                    </div>

                    <div className="atlas-surface-light p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                        <div className="text-xs atlas-text-secondary">
                          <strong>Smart Routing Memory™</strong> will remember this route for future transfers to the same country.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'compare-rates' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold atlas-text-primary">Compare Rates</h2>
                    
                    {quotes.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp size={48} className="mx-auto text-blue-400 mb-4" />
                        <p className="atlas-text-secondary">
                          Enter payment details and click "Compare Rates" to see provider options
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quotes.map((quote, idx) => (
                          <div
                            key={idx}
                            className="atlas-glass-surface-light p-4 rounded-lg space-y-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold atlas-text-primary">{quote.provider}</h3>
                              {idx === 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                  Best Rate
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="atlas-text-secondary text-xs">Fee</div>
                                <div className="font-medium">{quote.feePct}%</div>
                              </div>
                              <div>
                                <div className="atlas-text-secondary text-xs">Spread</div>
                                <div className="font-medium">{quote.spreadPct}%</div>
                              </div>
                              <div>
                                <div className="atlas-text-secondary text-xs">ETA</div>
                                <div className="font-medium flex items-center gap-1">
                                  <Clock size={12} />
                                  {quote.eta}
                                </div>
                              </div>
                              <div>
                                <div className="atlas-text-secondary text-xs">Total Cost</div>
                                <div className="font-medium">
                                  {(quote.feePct + quote.spreadPct).toFixed(2)}%
                                </div>
                              </div>
                            </div>

                            <div className="atlas-surface-light p-2 rounded text-xs">
                              <strong>Route:</strong> {quote.route}
                            </div>

                            <button
                              onClick={() => handleSimulateRoute(quote)}
                              className="atlas-button-secondary w-full text-sm"
                            >
                              Use This Route
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'recent-transfers' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold atlas-text-primary">Recent Transfers</h2>
                    <div className="text-center py-8">
                      <DollarSign size={48} className="mx-auto text-blue-400 mb-4" />
                      <p className="atlas-text-secondary">
                        No transfers yet in DRY_RUN mode
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'settings' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold atlas-text-primary">Settings / Security</h2>
                    
                    <div className="space-y-4">
                      <div className="atlas-glass-surface-light p-4 rounded-lg">
                        <h3 className="font-medium atlas-text-primary mb-2">DRY_RUN Mode</h3>
                        <p className="text-sm atlas-text-secondary mb-3">
                          Currently running in demonstration mode. No real transactions will be processed.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check size={16} />
                          <span>Safe Mode Active</span>
                        </div>
                      </div>

                      <div className="atlas-glass-surface-light p-4 rounded-lg">
                        <h3 className="font-medium atlas-text-primary mb-2">Smart Routing Memory™</h3>
                        <p className="text-sm atlas-text-secondary">
                          Automatically remembers your preferred routes and beneficiary details for faster repeat transfers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Rail - 70% */}
              <div className="flex-1">
                <ChatRail onSendMoneyRequest={handleSendMoneyRequest} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Atlas;
