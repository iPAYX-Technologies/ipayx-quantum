import React, { useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import SmartRoutingMemory from './SmartRoutingMemory';

interface ChatRailProps {
  onSendMoney?: (data: any) => void;
}

export default function ChatRail({ onSendMoney }: ChatRailProps) {
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'kimi' | 'deepseek' | 'openai'>('kimi');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  
  const providers = [
    { id: 'kimi' as const, label: 'Kimi-K2' },
    { id: 'deepseek' as const, label: 'DeepSeek' },
    { id: 'openai' as const, label: 'OpenAI' }
  ];

  const suggestions = [
    'Send 32,000 CAD to Pakistan',
    'Compare CAD→USDC providers now',
    "What's my best route today?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSubmit(suggestion);
  };

  const handleSubmit = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: messageText }];
    setMessages(newMessages);
    setInput('');

    // Check for smart routing memory
    const lowerMessage = messageText.toLowerCase();
    if (lowerMessage.includes('send') && lowerMessage.includes('to')) {
      const countryMatch = messageText.match(/to\s+(\w+)/i);
      if (countryMatch) {
        const country = countryMatch[1];
        const memoryFn = (window as any).smartRoutingMemory;
        
        if (memoryFn) {
          const route = memoryFn.getRouteForCountry(country);
          
          if (route) {
            // Route exists - use SmartRoutingMemory™
            setTimeout(() => {
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: `✨ SmartRoutingMemory™ activated! I found your previous route to ${country}:\n\n` +
                    `• Recipient: ${route.recipient}\n` +
                    `• Method: ${route.method}\n` +
                    `• Last amount: ${route.amount} ${route.currency}\n\n` +
                    `Shall I use the same route?`
                }
              ]);
            }, 500);
          } else {
            // New route - simulate response
            setTimeout(() => {
              const amountMatch = messageText.match(/(\d[\d,]*(?:\.\d+)?)\s*(\w+)/i);
              const amount = amountMatch ? amountMatch[1] : '0';
              const currency = amountMatch ? amountMatch[2] : 'CAD';
              
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: `I'll help you send ${amount} ${currency} to ${country}. Here's the recommended route:\n\n` +
                    `• Provider: NDAX\n` +
                    `• Method: NDAX→USDC→Circle\n` +
                    `• Fee: 0.20% + spread ~0.25%\n` +
                    `• ETA: 2-4 hours\n\n` +
                    `This route will be saved in SmartRoutingMemory™ for future use.`
                }
              ]);

              // Save to memory
              if (memoryFn) {
                memoryFn.saveRoute(country, `Recipient in ${country}`, amount, currency);
              }
            }, 800);
          }
        }
      }
    } else {
      // Generic response for other queries
      setTimeout(() => {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `I'm here to help with payments! You can:\n\n` +
              `• Send money internationally\n` +
              `• Compare rates across providers\n` +
              `• View recent transfers\n\n` +
              `Try: "Send 32,000 CAD to Pakistan"`
          }
        ]);
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="atlas-chat-rail">
      <div className="atlas-card" style={{ minHeight: '500px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} style={{ color: 'var(--atlas-accent)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              Quantum Chat
            </h2>
          </div>
          
          {/* Provider Selector (STUB ONLY) */}
          <div className="atlas-provider-selector">
            {providers.map(provider => (
              <button
                key={provider.id}
                className={`atlas-provider-button ${selectedProvider === provider.id ? 'active' : ''}`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ 
          minHeight: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '1.5rem'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem',
              opacity: 0.5 
            }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                👋 Welcome to Quantum Atlas
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                Try one of the suggestions below to get started
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: msg.role === 'user' 
                    ? 'var(--atlas-accent)' 
                    : 'var(--atlas-surface)',
                  borderRadius: 'var(--atlas-radius-md)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '0.75rem', 
                  marginBottom: '0.5rem',
                  opacity: 0.7
                }}>
                  {msg.role === 'user' ? 'You' : 'Quantum Assistant'}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Suggestion Chips */}
        {messages.length === 0 && (
          <div className="atlas-suggestions">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="atlas-suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            className="atlas-chat-input"
            placeholder="Send 32,000 CAD to Pakistan"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flex: 1 }}
          />
          <button 
            className="atlas-button"
            onClick={() => handleSubmit()}
            style={{ padding: '1rem' }}
          >
            <Send size={20} />
          </button>
        </div>

        {/* DRY_RUN Notice */}
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--atlas-surface)',
          borderRadius: 'var(--atlas-radius-sm)',
          fontSize: '0.75rem',
          opacity: 0.7,
          textAlign: 'center'
        }}>
          🔒 DRY_RUN Mode: No real API calls • All responses are simulated
        </div>
      </div>

      {/* Smart Routing Memory */}
      <SmartRoutingMemory />
    </div>
  );
}
