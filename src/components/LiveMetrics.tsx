import { motion } from "framer-motion";
import { DollarSign, Network, Building2, TrendingDown } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";

interface MetricCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  delay: number;
  loading?: boolean;
}

function LiveMetricCard({ icon: Icon, value, label, delay, loading }: MetricCardProps) {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="relative h-full rounded-2xl border border-border/40 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[var(--glow-cyan)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <motion.div
          className="mb-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </motion.div>

        <div className="mb-2">
          {loading ? (
            <div className="h-12 w-24 bg-muted/50 animate-pulse rounded" />
          ) : (
            <div className="text-5xl font-bold text-foreground leading-tight">
              {value}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground leading-relaxed flex items-center gap-2">
          {label}
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live data" />
        </div>

        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.4, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

export default function LiveMetrics() {
  const { metrics, loading } = useMetrics(30000); // Refresh every 30s

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Live Network Metrics
          </h2>
          <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-400">
            📊 Demo Data
          </span>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Illustrative data for demonstration purposes
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <LiveMetricCard
          icon={Network}
          value={loading ? "..." : metrics.activeRoutes}
          label="Active Routes"
          delay={0}
          loading={loading}
        />

        <LiveMetricCard
          icon={Building2}
          value={loading ? "..." : metrics.onramps}
          label="On-Ramps"
          delay={0.1}
          loading={loading}
        />

        <LiveMetricCard
          icon={TrendingDown}
          value={loading ? "..." : `${metrics.avgFxSpread} bps`}
          label="Avg FX Spread"
          delay={0.2}
          loading={loading}
        />

        <LiveMetricCard
          icon={DollarSign}
          value={loading ? "..." : formatVolume(metrics.volume24h)}
          label="24h Volume"
          delay={0.3}
          loading={loading}
        />
      </div>

      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-xs text-muted-foreground">
          Data updates every 30 seconds • Powered by live aggregation from Circle, Coinbase, Stellar, Tron & Hedera
        </p>
      </motion.div>
    </div>
  );
}
