import { motion } from "framer-motion";

export default function DataFlowParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Flux de particules horizontales (gauche → droite) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute w-2 h-2 rounded-full bg-accent"
          style={{
            top: `${10 + i * 12}%`,
            left: "-5%",
            boxShadow: "0 0 10px hsl(var(--accent)), 0 0 20px hsl(var(--accent) / 0.5)",
          }}
          animate={{
            x: ["0vw", "110vw"],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.5],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "linear",
          }}
        />
      ))}

      {/* Flux de particules verticales (haut → bas) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-electric-blue"
          style={{
            left: `${15 + i * 15}%`,
            top: "-5%",
            boxShadow: "0 0 8px hsl(var(--electric-blue))",
          }}
          animate={{
            y: ["0vh", "110vh"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Particules en spirale */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`spiral-${i}`}
          className="absolute w-1 h-1 rounded-full bg-secondary"
          style={{
            left: "50%",
            top: "50%",
            boxShadow: "0 0 6px hsl(var(--secondary))",
          }}
          animate={{
            x: [
              0,
              Math.cos((i * Math.PI * 2) / 5) * 200,
              Math.cos((i * Math.PI * 2) / 5 + Math.PI) * 200,
              0,
            ],
            y: [
              0,
              Math.sin((i * Math.PI * 2) / 5) * 200,
              Math.sin((i * Math.PI * 2) / 5 + Math.PI) * 200,
              0,
            ],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 1.6,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Lignes de connexion animées */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute h-px origin-left"
          style={{
            top: `${20 + i * 20}%`,
            left: "10%",
            width: "80%",
            background: "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.4), transparent)",
          }}
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.7,
          }}
        />
      ))}
    </div>
  );
}
