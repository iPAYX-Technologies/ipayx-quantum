/**
 * SmartRoutingMemory - Client-only helper for auto-filling payment forms
 * 
 * This component provides Smart Routing Memory™ functionality that remembers
 * previously used routes and auto-fills forms when the same country/recipient
 * is detected.
 */

import { useEffect, useState } from 'react';
import { getSmartRoutingMemory, saveSmartRoutingMemory, SmartRoute } from '@/services/atlas-api';

interface SmartRoutingMemoryProps {
  onRouteDetected?: (route: SmartRoute) => void;
  currentInput?: string;
}

export const SmartRoutingMemory = ({ onRouteDetected, currentInput }: SmartRoutingMemoryProps) => {
  const [routes, setRoutes] = useState<SmartRoute[]>([]);
  const [matchedRoute, setMatchedRoute] = useState<SmartRoute | null>(null);

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentInput && routes.length > 0) {
      const inputLower = currentInput.toLowerCase();
      
      // Try to match country from input
      const matched = routes.find(route => {
        const countryMatch = route.country && inputLower.includes(route.country.toLowerCase());
        const recipientMatch = route.recipient && inputLower.includes(route.recipient.toLowerCase());
        return countryMatch || recipientMatch;
      });

      if (matched && matched !== matchedRoute) {
        setMatchedRoute(matched);
        if (onRouteDetected) {
          onRouteDetected(matched);
        }
      }
    }
  }, [currentInput, routes, matchedRoute, onRouteDetected]);

  const loadRoutes = async () => {
    try {
      const memory = await getSmartRoutingMemory();
      setRoutes(memory);
    } catch (error) {
      console.error('Failed to load smart routes:', error);
    }
  };

  return null; // This is a headless component
};

/**
 * Hook for using Smart Routing Memory
 */
export const useSmartRoutingMemory = () => {
  const [routes, setRoutes] = useState<SmartRoute[]>([]);

  const loadRoutes = async () => {
    try {
      const memory = await getSmartRoutingMemory();
      setRoutes(memory);
    } catch (error) {
      console.error('Failed to load smart routes:', error);
    }
  };

  const saveRoute = async (route: SmartRoute) => {
    try {
      await saveSmartRoutingMemory(route);
      await loadRoutes();
    } catch (error) {
      console.error('Failed to save smart route:', error);
    }
  };

  const findMatchingRoute = (input: string): SmartRoute | null => {
    const inputLower = input.toLowerCase();
    
    return routes.find(route => {
      const countryMatch = route.country && inputLower.includes(route.country.toLowerCase());
      const recipientMatch = route.recipient && inputLower.includes(route.recipient.toLowerCase());
      return countryMatch || recipientMatch;
    }) || null;
  };

  useEffect(() => {
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    routes,
    saveRoute,
    findMatchingRoute,
    loadRoutes,
  };
};

export default SmartRoutingMemory;
