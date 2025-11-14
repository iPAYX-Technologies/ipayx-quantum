import { useState } from 'react';
import '../atlas/atlas.css';

interface LeftNavProps {
  onNavigate?: (section: string) => void;
}

export const LeftNav = ({ onNavigate }: LeftNavProps) => {
  const [activeSection, setActiveSection] = useState('send-money');

  const navItems = [
    { id: 'send-money', label: 'Send Money', icon: '💸' },
    { id: 'compare-rates', label: 'Compare Rates', icon: '📊' },
    { id: 'recent-transfers', label: 'Recent Transfers', icon: '📋' },
    { id: 'settings', label: 'Settings / Security', icon: '⚙️' }
  ];

  const handleClick = (id: string) => {
    setActiveSection(id);
    onNavigate?.(id);
  };

  return (
    <div className="atlas-leftnav">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          color: 'var(--atlas-text)',
          marginBottom: '0.5rem'
        }}>
          Atlas
        </h2>
        <p style={{ 
          fontSize: '0.875rem', 
          opacity: 0.7,
          color: 'var(--atlas-text)'
        }}>
          Payments Hub
        </p>
      </div>

      <nav>
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`atlas-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => handleClick(item.id)}
          >
            <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem',
        background: 'rgba(0, 255, 209, 0.1)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
          🔒 DRY_RUN Mode
        </div>
        <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>
          No real transactions
        </div>
      </div>
    </div>
  );
};
