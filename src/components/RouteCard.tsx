import { Card } from "@/components/ui/card";
import { Clock, TrendingUp, Target, Gauge } from "lucide-react";

interface RouteCardProps {
  type: "fastest" | "cheapest" | "balanced";
  provider: string;
  feePct: number; // TOTAL des frais (rail + iPAYX)
  railPartnerFee: number; // Frais du rail uniquement
  feeUSD: number;
  etaMin: number;
  breakdown?: any[];
  ipayxFee?: string;
  savings?: string;
}

const typeConfig = {
  fastest: {
    icon: Gauge,
    label: "Speed Optimized",
    accentBar: "bg-slate-400"
  },
  cheapest: {
    icon: Target,
    label: "Cost Optimized",
    accentBar: "bg-emerald-600"
  },
  balanced: {
    icon: TrendingUp,
    label: "Balanced Route",
    accentBar: "bg-blue-600"
  }
};

function MetricRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{label}</span>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function RouteCard({ type, provider, feePct, railPartnerFee, feeUSD, etaMin, breakdown, ipayxFee, savings }: RouteCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className="group relative overflow-hidden border border-border bg-card hover:border-muted transition-all duration-200">
      {/* Subtle accent bar */}
      <div className={`absolute top-0 left-0 w-1 h-full ${config.accentBar}`} />
      
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {config.label}
            </h3>
            <p className="text-sm text-foreground/80 mt-0.5">{provider}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-light text-foreground">
            {(feePct * 100).toFixed(2)}%
          </div>
          <span className="text-xs text-muted-foreground">total fee</span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="p-6 space-y-4">
        {/* Fee Breakdown */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fee Breakdown
          </h4>
          <div className="space-y-1.5">
            <MetricRow label="Partner Fee" value={`${(railPartnerFee * 100).toFixed(2)}%`} />
            <MetricRow label="iPAYX Protocol" value={ipayxFee || "0.70%"} badge="iPAYX" />
          </div>
        </div>
        
        {/* Total Fee */}
        <div className="pt-2 border-t border-border/50">
          <MetricRow label="Total Fee Amount" value={`$${feeUSD.toLocaleString()}`} />
        </div>
        
        {/* Settlement */}
        <div className="space-y-2 pt-4 border-t border-border/50">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Settlement
          </h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated Time</span>
            </div>
            <span className="font-medium text-foreground">
              {etaMin < 60 ? `~${etaMin} min` : `~${Math.round(etaMin / 60)} hrs`}
            </span>
          </div>
        </div>
        
        {/* Savings */}
        {savings && (
          <div className="space-y-2 pt-4 border-t border-border/50">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Savings vs Traditional
            </h4>
            <div className="text-2xl font-light text-emerald-600 dark:text-emerald-400">
              {savings}
            </div>
          </div>
        )}
        
        {/* Explanation */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md mt-2">
          <p>
            <span className="font-semibold text-foreground">How it works:</span>{' '}
            iPAYX finds the best {(railPartnerFee * 100).toFixed(2)}% partner rate, 
            then adds 0.7% protocol fee = {(feePct * 100).toFixed(2)}% total 
            (vs 2.8% traditional average)
          </p>
        </div>
      </div>
    </Card>
  );
}
