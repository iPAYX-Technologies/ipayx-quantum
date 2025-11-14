import { useState } from 'react';
import '../atlas/atlas.css';

interface ChatRailProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatRail = ({ onSuggestionClick }: ChatRailProps) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('Kimi-K2');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const suggestions = [
    'Send 32,000 CAD to Pakistan',
    'Compare CAD→USDC providers now',
    "What's my best route today?"
  ];

  const models = ['Kimi-K2', 'DeepSeek', 'OpenAI'];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    onSuggestionClick?.(suggestion);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);

    // Simulate assistant response (DRY_RUN stub)
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          content: `[DRY_RUN Mode] I would help you with: "${input}". In production, I would analyze routes, check rates, and provide smart recommendations based on your payment history.`
        }
      ]);
    }, 500);

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="atlas-chatrail">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
          Smart Payment Assistant
        </h3>
        <select
          className="atlas-model-picker"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Suggestion Chips */}
      <div style={{ 
        marginBottom: '1rem', 
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        paddingBottom: '0.5rem'
      }}>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            className="atlas-suggestion-chip"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        marginBottom: '1rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '0.75rem',
        minHeight: '300px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            opacity: 0.6
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <div>Ask me anything about payments, rates, or routing</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Try: "Send 32,000 CAD to Pakistan"
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: msg.role === 'user' 
                  ? 'var(--atlas-accent)' 
                  : 'rgba(255, 255, 255, 0.8)',
                color: msg.role === 'user' ? 'white' : 'var(--atlas-text)',
                borderRadius: '0.75rem',
                maxWidth: '85%',
                marginLeft: msg.role === 'user' ? 'auto' : '0'
              }}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          onClick={handleSend}
          style={{ whiteSpace: 'nowrap' }}
        >
          Send 📤
        </button>
      </div>

      <div style={{ 
        fontSize: '0.75rem', 
        opacity: 0.6, 
        marginTop: '0.5rem',
        textAlign: 'center'
      }}>
        DRY_RUN mode - No real API calls
      </div>
    </div>
  );
};
