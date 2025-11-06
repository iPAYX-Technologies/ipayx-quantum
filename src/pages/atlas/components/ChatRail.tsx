/**
 * ChatRail - Main Chat Interface Component (~70% width)
 * 
 * Features:
 * - Input with placeholder "Send 32,000 CAD to Pakistan"
 * - Model selector (Kimi-K2 / DeepSeek / OpenAI) - stubbed
 * - Scrolling suggestion chips
 * - Smart Routing Memory integration
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useSmartRoutingMemory } from './SmartRoutingMemory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRailProps {
  onSendMoneyRequest?: (data: { amount?: number; country?: string; route?: string }) => void;
}

export const ChatRail = ({ onSendMoneyRequest }: ChatRailProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('kimi-k2');
  const { findMatchingRoute, saveRoute } = useSmartRoutingMemory();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Send 32,000 CAD to Pakistan",
    "Compare CAD→USDC providers now",
    "What's my best route today?",
    "Show me recent transfers",
    "What are current exchange rates?",
  ];

  const models = [
    { id: 'kimi-k2', name: 'Kimi-K2' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'openai', name: 'OpenAI' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');

    // Check for Smart Routing Memory match
    const matchedRoute = findMatchingRoute(userInput);

    // Simulate AI response
    setTimeout(() => {
      let response = '';
      const lowerInput = userInput.toLowerCase();

      if (lowerInput.includes('send') && lowerInput.includes('pakistan')) {
        // Extract amount if present
        const amountMatch = userInput.match(/\d+[,\d]*/);
        const amount = amountMatch ? amountMatch[0].replace(/,/g, '') : '32000';
        
        if (matchedRoute) {
          response = `✨ Smart Routing Memory™ activated! I found your previous route to Pakistan.\n\n` +
            `Amount: ${amount} CAD\n` +
            `Route: ${matchedRoute.method || 'NDAX→USDC→Circle'}\n` +
            `Beneficiary: ${matchedRoute.beneficiary || 'Auto-filled'}\n\n` +
            `Ready to proceed with this saved route?`;
        } else {
          response = `I'll help you send ${amount} CAD to Pakistan.\n\n` +
            `Best route: NDAX→USDC→Circle\n` +
            `Estimated fee: 0.45%\n` +
            `ETA: 2-4 hours\n\n` +
            `Would you like to proceed with this transfer?`;
          
          // Save this route for future use
          saveRoute({
            country: 'Pakistan',
            amount: parseFloat(amount),
            currency: 'CAD',
            method: 'NDAX→USDC→Circle',
            lastUsed: new Date().toISOString(),
          });
        }
        
        if (onSendMoneyRequest) {
          onSendMoneyRequest({
            amount: parseFloat(amount),
            country: 'Pakistan',
            route: matchedRoute?.method || 'NDAX→USDC→Circle',
          });
        }
      } else if (lowerInput.includes('compare') || lowerInput.includes('rate')) {
        response = `I'll show you a comparison of providers for CAD→USDC transfers.\n\n` +
          `Available providers:\n` +
          `1. NDAX - 0.45% total (fastest)\n` +
          `2. Cybrid - 0.65% total\n` +
          `3. Bank Wire - 1.50% total (slowest)\n\n` +
          `Would you like detailed quotes?`;
      } else if (lowerInput.includes('best route')) {
        response = `Based on current market conditions, your best route is:\n\n` +
          `NDAX→USDC→Circle\n` +
          `Total cost: 0.45%\n` +
          `Settlement time: 2-4 hours\n\n` +
          `This route offers the best balance of speed and cost.`;
      } else {
        response = `I'm here to help with your cross-border payments! You can:\n\n` +
          `• Send money internationally\n` +
          `• Compare exchange rates\n` +
          `• View recent transfers\n` +
          `• Get routing recommendations\n\n` +
          `Try: "Send 32,000 CAD to Pakistan"`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="atlas-glass-surface atlas-chat-rail">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-500" size={24} />
            <div>
              <h2 className="font-semibold atlas-text-primary">Payment Assistant</h2>
              <p className="text-xs atlas-text-secondary">Powered by Smart Routing Memory™</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="atlas-input text-sm px-3 py-2"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto atlas-scrollbar mt-4 pb-2">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="atlas-chip"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="atlas-chat-messages atlas-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles size={48} className="text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold atlas-text-primary mb-2">
              Welcome to Quantum Atlas
            </h3>
            <p className="atlas-text-secondary max-w-md">
              Ask me anything about cross-border payments, exchange rates, or routing options.
              I'll remember your preferences with Smart Routing Memory™.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'atlas-glass-surface-light atlas-text-primary'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'atlas-text-secondary'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="atlas-chat-input-container">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send 32,000 CAD to Pakistan"
            className="atlas-input flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="atlas-button-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-xs atlas-text-secondary mt-2">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            DRY_RUN Mode - No real transactions
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatRail;
