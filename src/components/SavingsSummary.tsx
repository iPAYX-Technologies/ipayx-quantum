import { Card } from "@/components/ui/card";
import { Target, TrendingDown, Clock, CreditCard, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface SavingsSummaryProps {
  savings: number;
  breakdown: {
    feeSavings: number;
    capitalFreed: number;
    creditAvoided: number;
    supplierImpact: number;
  };
}

export default function SavingsSummary({ savings, breakdown }: SavingsSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border-2 border-primary/40">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Target className="h-8 w-8 text-primary animate-pulse" />
          <h4 className="text-xl font-bold text-foreground">YOU SAVE</h4>
        </div>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="py-4"
        >
          <p className="text-5xl font-black text-primary">
            {formatCurrency(savings)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">per year</p>
        </motion.div>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary hover:text-primary/80 underline transition-colors"
        >
          {expanded ? "Hide breakdown ↑" : "See breakdown ↓"}
        </button>
      </div>

      {/* Breakdown Section */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-6 pt-6 border-t border-primary/20 space-y-4"
        >
          {/* Fee Savings */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Fee Savings</p>
              <p className="text-sm font-semibold text-foreground">
                70% lower fees (0.7% vs 2-3%)
              </p>
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(breakdown.feeSavings)}
            </p>
          </div>

          {/* Capital Freed */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Time = Money</p>
              <p className="text-sm font-semibold text-foreground">
                8 seconds vs 3-5 days transit
              </p>
            </div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(breakdown.capitalFreed)}
            </p>
          </div>

          {/* Credit Avoided */}
          {breakdown.creditAvoided > 0 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Credit Cost Avoided</p>
                <p className="text-sm font-semibold text-foreground">
                  No margin needed during transit
                </p>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(breakdown.creditAvoided)}
              </p>
            </div>
          )}

          {/* Supplier Impact */}
          {breakdown.supplierImpact > 0 && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Supplier Impact</p>
                <p className="text-sm font-semibold text-foreground">
                  Avoid penalties for late payment
                </p>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(breakdown.supplierImpact)}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Bottom Message */}
      <div className="mt-6 pt-4 border-t border-primary/20">
        <p className="text-xs text-center text-muted-foreground">
          💡 Not just the transfer fee - hidden costs add up fast
        </p>
      </div>
    </Card>
  );
}
