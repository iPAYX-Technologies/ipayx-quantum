import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceBanner() {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const dismissed = localStorage.getItem('banner_dismissed');
    if (dismissed === 'true') setVisible(false);
  }, []);
  
  const handleDismiss = () => {
    localStorage.setItem('banner_dismissed', 'true');
    setVisible(false);
  };
  
  if (!visible) return null;
  
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-6 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm md:text-base flex-wrap">
          <span className="font-bold whitespace-nowrap">🚀 iPAYX Closed Beta</span>
          <span className="hidden sm:inline">49 companies processing $3.6M+ in payments</span>
          <a href="mailto:ybolduc@ipayx.ai" className="underline font-semibold hover:text-white/90 transition-colors whitespace-nowrap">
            Request Early Access →
          </a>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDismiss} 
          className="text-white hover:bg-white/20 shrink-0"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
