import { motion } from "framer-motion";
import { DollarSign, Network, Grid3x3 } from "lucide-react";
import { useState } from "react";

const LAYERS = [
  {
    id: "settlement",
    title: "Fiat Settlement Layer",
    icon: DollarSign,
    description: "Direct bank integration • Real-time SWIFT/ACH • Multi-currency support",
    color: "hsl(var(--primary))",
  },
  {
    id: "router",
    title: "Multi-Chain Router",
    icon: Network,
    description: "135+ payment rails • AI-powered routing • Optimal path selection",
    color: "hsl(var(--accent))",
  },
  {
    id: "liquidity",
    title: "Quantum Liquidity Pool",
    icon: Grid3x3,
    description: "Unified liquidity • Cross-chain swaps • Stablecoins & RWA",
    color: "hsl(var(--electric-blue))",
  },
];

export default function ProtocolStack() {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  return (
    <div className="relative w-full min-h-[700px] flex items-center justify-center py-12">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Stack container */}
      <div className="relative" style={{ perspective: "1200px" }}>
        <div className="relative flex flex-col items-center gap-4">
          {LAYERS.map((layer, idx) => {
            const isHovered = hoveredLayer === layer.id;
            const Icon = layer.icon;
            
            return (
              <motion.div
                key={layer.id}
                className="relative group cursor-pointer"
                style={{
                  transformStyle: "preserve-3d",
                  zIndex: LAYERS.length - idx,
                }}
                initial={{ opacity: 0, y: -50, rotateX: -15 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  rotateX: isHovered ? 0 : -15,
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{ 
                  delay: idx * 0.2,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                onHoverStart={() => setHoveredLayer(layer.id)}
                onHoverEnd={() => setHoveredLayer(null)}
              >
                {/* Diamond/Rhombus shape */}
                <div
                  className="relative w-80 h-44 border-2 transition-all duration-300"
                  style={{
                    background: isHovered 
                      ? `linear-gradient(135deg, ${layer.color}15, ${layer.color}05)`
                      : "hsl(var(--card) / 0.5)",
                    borderColor: isHovered ? layer.color : "hsl(var(--border) / 0.3)",
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                    backdropFilter: "blur(10px)",
                    boxShadow: isHovered 
                      ? `0 0 30px ${layer.color}40, inset 0 0 20px ${layer.color}10`
                      : "none",
                  }}
                >
                  {/* Inner content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-6">
                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.2 : 1,
                        rotateZ: isHovered ? 360 : 0,
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon 
                        className="mb-3" 
                        size={isHovered ? 40 : 32}
                        style={{ color: layer.color }}
                        strokeWidth={1.5}
                      />
                    </motion.div>

                    {/* Title */}
                    <h3 
                      className="text-lg font-bold text-center mb-1"
                      style={{ color: isHovered ? layer.color : "hsl(var(--foreground))" }}
                    >
                      {layer.title}
                    </h3>

                    {/* Description (only show on hover) */}
                    <motion.p
                      className="text-xs text-center text-muted-foreground leading-relaxed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: isHovered ? 1 : 0,
                        height: isHovered ? "auto" : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {layer.description}
                    </motion.p>
                  </div>

                  {/* Wireframe grid overlay */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ opacity: isHovered ? 0.15 : 0.05 }}
                  >
                    <defs>
                      <pattern
                        id={`grid-${layer.id}`}
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 20 0 L 0 0 0 20"
                          fill="none"
                          stroke={layer.color}
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${layer.id})`} />
                  </svg>
                </div>

                {/* Connecting line to next layer */}
                {idx < LAYERS.length - 1 && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-primary/50 to-primary/20"
                    style={{
                      height: "20px",
                      top: "100%",
                      zIndex: -1,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: idx * 0.2 + 0.3, duration: 0.4 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom description */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p className="text-sm text-muted-foreground">
          Three-layer architecture enabling seamless cross-border payments with quantum speed and efficiency
        </p>
      </motion.div>
    </div>
  );
}
