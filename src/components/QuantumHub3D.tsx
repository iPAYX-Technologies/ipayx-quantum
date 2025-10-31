import { motion } from "framer-motion";

export default function QuantumHub3D() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow atmosphérique doux */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(51, 181, 229, 0.3) 0%, rgba(51, 181, 229, 0.15) 40%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Cercle principal avec gradient animé */}
      <svg width="320" height="320" className="relative z-10">
        <defs>
          <linearGradient id="quantumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33B5E5" stopOpacity="1">
              <animate attributeName="stop-color" values="#33B5E5;#0EA5E9;#33B5E5" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="1">
              <animate attributeName="stop-color" values="#0EA5E9;#33B5E5;#0EA5E9" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        <circle
          cx="160"
          cy="160"
          r="158"
          fill="none"
          stroke="url(#quantumGradient)"
          strokeWidth="3"
          strokeDasharray="10 5"
          style={{
            filter: 'drop-shadow(0 0 12px rgba(51, 181, 229, 0.4))',
          }}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 160 160"
            to="360 160 160"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Particules orbitales */}
        {[...Array(5)].map((_, i) => {
          const angle = (i * 72);
          const radius = 158;
          return (
            <g key={`orbit-${i}`}>
              <circle
                cx="160"
                cy="160"
                r="4"
                fill="#FFFFFF"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))',
                }}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${angle} 160 160`}
                  to={`${angle + 360} 160 160`}
                  dur={`${10 + i * 2}s`}
                  repeatCount="indefinite"
                />
                <animateMotion
                  path={`M 160 ${160 - radius} A ${radius} ${radius} 0 1 1 160 ${160 + radius} A ${radius} ${radius} 0 1 1 160 ${160 - radius}`}
                  dur={`${10 + i * 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

        {/* Point central blanc lumineux */}
        <circle
          cx="160"
          cy="160"
          r="5"
          fill="#FFFFFF"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
          }}
        >
          <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
