import React from 'react';
import { Send, TrendingUp, Clock, Settings } from 'lucide-react';

interface LeftNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function LeftNav({ activeTab, onTabChange }: LeftNavProps) {
  const navItems = [
    { id: 'send-money', label: 'Send Money', icon: Send },
    { id: 'compare-rates', label: 'Compare Rates', icon: TrendingUp },
    { id: 'recent-transfers', label: 'Recent Transfers', icon: Clock },
    { id: 'settings', label: 'Settings / Security', icon: Settings },
  ];

  return (
    <div className="atlas-left-nav">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          color: 'var(--atlas-text-dark)',
          marginBottom: '0.5rem'
        }}>
          Quantum Atlas
        </h2>
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--atlas-text-dark)', 
          opacity: 0.6,
          fontWeight: 500
        }}>
          Smart Routing Memory™
        </p>
      </div>

      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`atlas-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        left: '2rem', 
        right: '2rem' 
      }}>
        <button 
          className="atlas-button-secondary"
          style={{ 
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.875rem'
          }}
        >
          Sign In
        </button>
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--atlas-text-dark)', 
          opacity: 0.5,
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          DRY_RUN Mode Active
        </p>
      </div>
    </div>
  );
}
