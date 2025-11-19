/**
 * LeftNav - Atlas Navigation Component (Payments-Only)
 * 
 * Provides navigation for:
 * 1. Send Money
 * 2. Compare Rates
 * 3. Recent Transfers
 * 4. Settings / Security
 */

import { useState } from 'react';
import { Send, TrendingUp, History, Settings, User } from 'lucide-react';

interface LeftNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const LeftNav = ({ activeSection, onSectionChange }: LeftNavProps) => {
  const navItems = [
    { id: 'send-money', label: 'Send Money', icon: Send },
    { id: 'compare-rates', label: 'Compare Rates', icon: TrendingUp },
    { id: 'recent-transfers', label: 'Recent Transfers', icon: History },
    { id: 'settings', label: 'Settings / Security', icon: Settings },
  ];

  return (
    <div className="atlas-glass-surface p-6 h-full">
      {/* Logo / Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold atlas-text-primary">Quantum Atlas</h1>
        <p className="text-sm atlas-text-secondary mt-1">Smart Routing Memory™</p>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <div
              key={item.id}
              className={`atlas-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="atlas-nav-item cursor-default">
          <User size={20} />
          <div className="flex-1">
            <div className="text-sm font-medium">Demo User</div>
            <div className="text-xs atlas-text-secondary">DRY_RUN Mode</div>
          </div>
        </div>
        
        {/* Sign In Button (Placeholder) */}
        <button className="atlas-button-secondary w-full mt-4 text-sm">
          Sign In
        </button>
      </div>
    </div>
  );
};

export default LeftNav;
