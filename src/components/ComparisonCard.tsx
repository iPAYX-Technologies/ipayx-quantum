import { Card } from "@/components/ui/card";
import { Check, X, Clock, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ComparisonCardProps {
  type: "legacy" | "ipayx";
  data: {
    transitTime: string;
    fees: number;
    frozenCapital: number;
    creditCost: number;
    total: number;
  };
  amount: number;
}

export default function ComparisonCard({ type, data, amount }: ComparisonCardProps) {
  const { t } = useLanguage();
  const isLegacy = type === "legacy";
  const Icon = isLegacy ? X : Check;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <Card className={cn(
      "p-6 space-y-4 border-2 transition-all",
      isLegacy 
        ? "bg-destructive/5 border-destructive/40 hover:border-destructive/60" 
        : "bg-primary/5 border-primary/40 hover:border-primary/60"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className={cn(
          "text-xl font-bold",
          isLegacy ? "text-destructive" : "text-primary"
        )}>
          {isLegacy ? t.roiCalculator.legacyBanking : t.roiCalculator.ipayxProtocol}
        </h4>
        <Icon className={cn(
          "h-8 w-8",
          isLegacy ? "text-destructive" : "text-primary"
        )} />
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {/* Transit Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={cn(
              "h-4 w-4",
              isLegacy ? "text-destructive/70" : "text-primary/70"
            )} />
            <span className="text-sm text-muted-foreground">{t.roiCalculator.transitTimeLabel}</span>
          </div>
          <span className={cn(
            "font-semibold",
            isLegacy ? "text-destructive" : "text-primary"
          )}>
            {data.transitTime}
          </span>
        </div>

        {/* Fees */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={cn(
              "h-4 w-4",
              isLegacy ? "text-destructive/70" : "text-primary/70"
            )} />
            <span className="text-sm text-muted-foreground">{t.roiCalculator.transferFeesLabel}</span>
          </div>
          <span className={cn(
            "font-semibold",
            isLegacy ? "text-destructive" : "text-primary"
          )}>
            {formatCurrency(data.fees)}
          </span>
        </div>

        {/* Frozen Capital */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className={cn(
              "h-4 w-4",
              isLegacy ? "text-destructive/70" : "text-primary/70"
            )} />
            <span className="text-sm text-muted-foreground">{t.roiCalculator.capitalFrozenLabel}</span>
          </div>
          <span className={cn(
            "font-semibold",
            isLegacy ? "text-destructive" : "text-primary"
          )}>
            {formatCurrency(data.frozenCapital)}
          </span>
        </div>

        {/* Credit Cost (if applicable) */}
        {data.creditCost > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className={cn(
                "h-4 w-4",
                isLegacy ? "text-destructive/70" : "text-primary/70"
              )} />
              <span className="text-sm text-muted-foreground">{t.roiCalculator.creditCostLabel}</span>
            </div>
            <span className={cn(
              "font-semibold",
              isLegacy ? "text-destructive" : "text-primary"
            )}>
              {formatCurrency(data.creditCost)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className={cn(
        "pt-4 mt-4 border-t",
        isLegacy ? "border-destructive/20" : "border-primary/20"
      )}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{t.roiCalculator.totalCost}</span>
          <span className={cn(
            "text-2xl font-bold",
            isLegacy ? "text-destructive" : "text-primary"
          )}>
            {formatCurrency(data.total)}
          </span>
        </div>
      </div>

      {/* Micro-message */}
      <div className={cn(
        "text-xs p-3 rounded-lg",
        isLegacy 
          ? "bg-destructive/10 text-destructive" 
          : "bg-primary/10 text-primary"
      )}>
        {isLegacy 
          ? t.roiCalculator.legacyMessage.replace('{{time}}', data.transitTime)
          : t.roiCalculator.ipayxMessage}
      </div>
    </Card>
  );
}
