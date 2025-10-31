import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Clock, TrendingDown, Target, Globe } from "lucide-react";
import { useEffect } from "react";

interface MetricCardProps {
  icon: React.ElementType;
  value: string;
  subtitle: string;
  description: string;
  delay: number;
}

function ExecutiveMetricCard({ icon: Icon, value, subtitle, description, delay }: MetricCardProps) {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Card container */}
      <div className="relative h-full rounded-2xl border border-border/40 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[var(--glow-cyan)]">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon */}
        <motion.div
          className="mb-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </motion.div>

        {/* Main value */}
        <motion.div
          className="mb-2"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2, duration: 0.5, type: "spring" }}
        >
          <div className="text-5xl font-bold text-foreground leading-tight">
            {value}
          </div>
        </motion.div>

        {/* Subtitle */}
        <div className="text-lg font-semibold text-primary mb-2">
          {subtitle}
        </div>

        {/* Description */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </div>

        {/* Bottom accent line */}
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

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, target, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [count, target]);

  return (
    <motion.span>
      {rounded.get().toLocaleString()}{suffix}
    </motion.span>
  );
}

export default function ExecutiveMetrics() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-16">
      {/* Section header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Executive Performance Metrics
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Real-world impact for CFOs and finance leaders
        </p>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExecutiveMetricCard
          icon={Clock}
          value="8s"
          subtitle="Capital Efficiency"
          description="Average settlement time vs 3-5 days with traditional banking"
          delay={0}
        />

        <ExecutiveMetricCard
          icon={TrendingDown}
          value="jusqu'à 70%"
          subtitle="Cost Reduction"
          description="Average savings vs. traditional wire transfers"
          delay={0.1}
        />

        <ExecutiveMetricCard
          icon={Target}
          value="30 days"
          subtitle="ROI Timeline"
          description="Breakeven period for enterprises processing $100M+ annually"
          delay={0.2}
        />

        <ExecutiveMetricCard
          icon={Globe}
          value="$2.1B+"
          subtitle="Scale"
          description="Pilot program volume (2024 Q1-Q3) across 12 partner countries"
          delay={0.3}
        />
      </div>

    </div>
  );
}
