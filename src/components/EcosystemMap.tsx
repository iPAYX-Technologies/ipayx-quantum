import { motion } from "framer-motion";

interface Layer {
  name: string;
  color: string;
  partners: string[];
  description: string;
}

const layers: Layer[] = [
  {
    name: "Liquidity Layer",
    color: "#22d3ee",
    partners: ["Circle USDC", "Stellar", "Solana"],
    description: "Multi-chain stablecoin pools with instant settlement"
  },
  {
    name: "Settlement Layer",
    color: "#3b82f6",
    partners: ["XRP Ledger", "Hedera", "Tron"],
    description: "High-speed cross-border payment rails"
  },
  {
      name: "Intelligence Layer",
      color: "#6366f1",
      partners: ["Live Pricing", "AI Routing", "Oracle Network"],
      description: "Real-time pricing and smart routing optimization"
    },
  {
    name: "Access Layer",
    color: "#8b5cf6",
    partners: ["Apple Pay", "SEPA", "Interac", "25+ Ramps"],
    description: "Universal fiat on/off-ramps and payment methods"
  }
];

export default function EcosystemMap({ lang = 'en' }: { lang?: 'en' | 'fr' }) {
  const title = lang === 'fr' 
    ? "Architecture iPayX C4 - Écosystème Quantum Rail"
    : "iPayX C4 Architecture - Quantum Rail Ecosystem";

  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center text-gray-400 mb-16 max-w-2xl mx-auto"
        >
          {lang === 'fr' 
            ? "4 couches interconnectées pour des paiements cross-chain sans friction"
            : "4 interconnected layers for frictionless cross-chain payments"}
        </motion.p>

        {/* Visual Ecosystem Layers */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {layers.map((layer, index) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-black p-8 hover:border-cyan-500/30 transition-all duration-500"
            >
              {/* Layer glow effect */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl"
                style={{ backgroundColor: layer.color }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-3 w-3 rounded-full animate-pulse"
                    style={{ backgroundColor: layer.color }}
                  />
                  <h3 className="text-2xl font-bold" style={{ color: layer.color }}>
                    {layer.name}
                  </h3>
                </div>
                
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {layer.description}
                </p>

                {/* Partners */}
                <div className="flex flex-wrap gap-2">
                  {layer.partners.map((partner) => (
                    <span
                      key={partner}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: `${layer.color}40`,
                        backgroundColor: `${layer.color}15`,
                        color: layer.color,
                      }}
                    >
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central SVG Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl border border-slate-800/50 bg-slate-950/60 p-8 md:p-12"
        >
          <svg viewBox="0 0 800 600" className="w-full h-auto">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            <line x1="400" y1="100" x2="200" y2="250" stroke="url(#grad1)" strokeWidth="2" opacity="0.6" />
            <line x1="400" y1="100" x2="600" y2="250" stroke="url(#grad1)" strokeWidth="2" opacity="0.6" />
            <line x1="200" y1="250" x2="200" y2="400" stroke="url(#grad2)" strokeWidth="2" opacity="0.6" />
            <line x1="600" y1="250" x2="600" y2="400" stroke="url(#grad2)" strokeWidth="2" opacity="0.6" />
            <line x1="200" y1="400" x2="400" y2="500" stroke="url(#grad1)" strokeWidth="2" opacity="0.6" />
            <line x1="600" y1="400" x2="400" y2="500" stroke="url(#grad1)" strokeWidth="2" opacity="0.6" />

            {/* Layer nodes */}
            <circle cx="400" cy="100" r="60" fill="url(#grad1)" filter="url(#glow)" />
            <text x="400" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Liquidity</text>

            <circle cx="200" cy="250" r="55" fill="url(#grad2)" filter="url(#glow)" />
            <text x="200" y="255" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Settlement</text>

            <circle cx="600" cy="250" r="55" fill="url(#grad2)" filter="url(#glow)" />
            <text x="600" y="255" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Intelligence</text>

            <circle cx="200" cy="400" r="50" fill="#8b5cf6" filter="url(#glow)" />
            <text x="200" y="405" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Access</text>

            <circle cx="600" cy="400" r="50" fill="#8b5cf6" filter="url(#glow)" />
            <text x="600" y="405" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Routing</text>

            <circle cx="400" cy="500" r="45" fill="#22d3ee" filter="url(#glow)" />
            <text x="400" y="505" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">API Layer</text>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
