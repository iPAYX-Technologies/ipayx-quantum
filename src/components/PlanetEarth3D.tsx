import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DataRoute {
  from: { x: number; y: number; name: string };
  to: { x: number; y: number; name: string };
  color: string;
  thickness: number;
  speed: number;
}

export default function PlanetEarth3D() {
  const [particleProgress, setParticleProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticleProgress((prev) => (prev + 0.01) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Routes de données live
  const routes: DataRoute[] = [
    // Route principale Montréal → Bangladesh (ligne plus foncée/épaisse)
    {
      from: { x: 22, y: 35, name: "Montréal" },
      to: { x: 72, y: 48, name: "Dhaka" },
      color: "#8B0000", // Rouge foncé
      thickness: 3,
      speed: 2.5,
    },
    // Autres routes globales
    {
      from: { x: 25, y: 40, name: "New York" },
      to: { x: 55, y: 42, name: "Londres" },
      color: "#00B8D4",
      thickness: 1.5,
      speed: 3,
    },
    {
      from: { x: 55, y: 42, name: "Londres" },
      to: { x: 82, y: 38, name: "Tokyo" },
      color: "#00B8D4",
      thickness: 1.5,
      speed: 3.5,
    },
    {
      from: { x: 15, y: 45, name: "San Francisco" },
      to: { x: 78, y: 58, name: "Singapour" },
      color: "#4FC3F7",
      thickness: 1.5,
      speed: 2.8,
    },
    {
      from: { x: 52, y: 38, name: "Paris" },
      to: { x: 65, y: 52, name: "Dubai" },
      color: "#00B8D4",
      thickness: 1.5,
      speed: 3.2,
    },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* Glow atmosphérique simplifié */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 184, 212, 0.1) 0%, transparent 60%)",
        }}
        animate={{
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Planète - Style minimaliste noir */}
      <motion.div
        className="relative w-[400px] h-[400px] rounded-full overflow-hidden"
        style={{
          background: "radial-gradient(circle at 30% 30%, #0a0a0a 0%, #000000 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "inset -10px -10px 40px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 184, 212, 0.15)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Continents simplifiés - style minimaliste */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {/* Formes géométriques simples en gris foncé */}
          <ellipse cx="120" cy="100" rx="40" ry="50" fill="#1a1a1a" />
          <ellipse cx="260" cy="180" rx="50" ry="65" fill="#1a1a1a" />
          <circle cx="360" cy="140" r="45" fill="#1a1a1a" />
          <ellipse cx="340" cy="280" rx="35" ry="40" fill="#1a1a1a" />
          <ellipse cx="150" cy="260" rx="35" ry="55" fill="#1a1a1a" />
        </svg>

        {/* Nodes - Points blancs minimalistes */}
        {routes.flatMap((route) => [route.from, route.to]).map((city, i) => (
          <motion.div
            key={`${city.name}-${i}`}
            className="absolute rounded-full"
            style={{
              width: "3px",
              height: "3px",
              left: `${city.x}%`,
              top: `${city.y}%`,
              background: "#ffffff",
              boxShadow: "0 0 6px rgba(255, 255, 255, 0.8)",
            }}
            animate={{
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}

        {/* Lignes de connexion - minimalistes fines */}
        <svg className="absolute inset-0 w-full h-full">
          {routes.map((route, i) => {
            const midX = (route.from.x + route.to.x) / 2;
            const midY = Math.min(route.from.y, route.to.y) - 8;
            
            return (
              <motion.path
                key={i}
                d={`M ${route.from.x}% ${route.from.y}% Q ${midX}% ${midY}%, ${route.to.x}% ${route.to.y}%`}
                stroke={i === 0 ? "#8B0000" : "rgba(255, 255, 255, 0.3)"}
                strokeWidth={i === 0 ? "2" : "0.5"}
                fill="none"
                strokeLinecap="round"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: route.speed,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            );
          })}
        </svg>

        {/* Particules animées le long des routes */}
        {routes.map((route, i) => {
          const midX = (route.from.x + route.to.x) / 2;
          const midY = Math.min(route.from.y, route.to.y) - 8;
          const t = (particleProgress + i * 0.2) % 1;
          // Calcul de position quadratique de Bézier
          const x = (1 - t) * (1 - t) * route.from.x + 2 * (1 - t) * t * midX + t * t * route.to.x;
          const y = (1 - t) * (1 - t) * route.from.y + 2 * (1 - t) * t * midY + t * t * route.to.y;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: route.thickness * 2,
                height: route.thickness * 2,
                left: `${x}%`,
                top: `${y}%`,
                background: route.color,
                boxShadow: `0 0 10px ${route.color}`,
                opacity: Math.sin(t * Math.PI), // Fade in/out aux extrémités
              }}
            />
          );
        })}
      </motion.div>


      {/* Compteur de transactions live */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full"
        style={{
          background: "rgba(0, 184, 212, 0.15)",
          border: "1px solid rgba(0, 184, 212, 0.3)",
          backdropFilter: "blur(10px)",
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-[#00B8D4]" style={{ boxShadow: "0 0 8px #00B8D4" }} />
          <span className="text-[#00B8D4] font-mono">Live Routes Active</span>
        </div>
      </motion.div>
    </div>
  );
}
