import { useEffect, useState } from 'react';
import { atlasApi } from '@/services/atlas-api';
import '../atlas/atlas.css';

interface SmartRoutingMemoryProps {
  onMemoryMatch?: (match: any) => void;
}

export const SmartRoutingMemory = ({ onMemoryMatch }: SmartRoutingMemoryProps) => {
  const [memories, setMemories] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const response = await atlasApi.getMemory();
      if (response.success) {
        setMemories(response.data);
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMemory = async (data: {
    recipient: string;
    country: string;
    method: string;
    amount?: number;
  }) => {
    try {
      const response = await atlasApi.saveMemory(data);
      if (response.success) {
        setMemories({ ...memories, ...response.data });
      }
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  };

  const checkForMatch = (input: string) => {
    const inputLower = input.toLowerCase();
    
    // Check if input contains country or recipient names
    for (const [key, value] of Object.entries(memories)) {
      const [country, recipient] = key.split('_');
      if (inputLower.includes(country) || inputLower.includes(recipient)) {
        onMemoryMatch?.(value);
        return value;
      }
    }
    return null;
  };

  // Demo: Add a sample memory on mount if empty
  useEffect(() => {
    if (!isLoading && Object.keys(memories).length === 0) {
      // Add a demo memory
      saveMemory({
        recipient: 'Family in Pakistan',
        country: 'Pakistan',
        method: 'NDAX→USDC→Circle',
        amount: 32000
      });
    }
  }, [isLoading]);

  const memoryCount = Object.keys(memories).length;

  return (
    <div style={{ 
      background: 'rgba(0, 255, 209, 0.1)',
      border: '1px solid var(--atlas-accent)',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginTop: '1rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <span style={{ fontWeight: '600', fontSize: '1rem' }}>
            Smart Routing Memory™
          </span>
        </div>
        <span className="atlas-memory-indicator">
          {memoryCount} {memoryCount === 1 ? 'route' : 'routes'} saved
        </span>
      </div>

      <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.75rem' }}>
        Automatically remembers your frequent recipients and preferred routes
      </div>

      {isLoading ? (
        <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
          Loading memories...
        </div>
      ) : memoryCount > 0 ? (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            Recent Routes:
          </div>
          {Object.entries(memories).slice(0, 3).map(([key, value]) => (
            <div 
              key={key}
              style={{
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '0.25rem'
              }}
            >
              <div style={{ fontWeight: '500' }}>
                {value.country} - {value.recipient}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                {value.method} • {value.amount ? `${value.amount} CAD` : 'Amount varies'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.875rem', opacity: 0.6, fontStyle: 'italic' }}>
          No routes saved yet. Send your first payment to start building memory.
        </div>
      )}

      <div style={{ 
        fontSize: '0.75rem', 
        opacity: 0.6, 
        marginTop: '0.75rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        paddingTop: '0.5rem'
      }}>
        💡 Type a country name you've used before to auto-fill details
        <br />
        🔒 Stored locally (localStorage) • DRY_RUN demo only
      </div>
    </div>
  );
};
