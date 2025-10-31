import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Major financial centers for nodes
const NETWORK_NODES = [
  { name: "New York", x: 25, y: 40, size: "large" },
  { name: "London", x: 48, y: 35, size: "large" },
  { name: "Singapore", x: 78, y: 58, size: "large" },
  { name: "Dubai", x: 60, y: 48, size: "medium" },
  { name: "Tokyo", x: 85, y: 42, size: "medium" },
  { name: "Hong Kong", x: 80, y: 50, size: "medium" },
  { name: "Sydney", x: 88, y: 75, size: "small" },
  { name: "São Paulo", x: 32, y: 70, size: "small" },
  { name: "Mumbai", x: 68, y: 52, size: "small" },
  { name: "Toronto", x: 22, y: 38, size: "small" },
];

// Connection lines between major hubs
const CONNECTIONS = [
  [0, 1], // NY - London
  [1, 3], // London - Dubai
  [3, 2], // Dubai - Singapore
  [2, 4], // Singapore - Tokyo
  [4, 5], // Tokyo - Hong Kong
  [0, 7], // NY - São Paulo
  [2, 6], // Singapore - Sydney
  [3, 8], // Dubai - Mumbai
];

interface Props {
  t: {
    title: string;
    activeNodes: string;
  };
}

export default function GlobalNetworkMapFlat({ t }: Props) {
  const [activeNodes, setActiveNodes] = useState(127);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNodes((prev) => prev + Math.floor(Math.random() * 3 - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px] bg-black rounded-2xl border border-white/10 overflow-hidden">
      {/* IOTA-style diagonal grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #ffffff 1px, transparent 1px),
            linear-gradient(-45deg, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* World map SVG background - dark grey vector */}
      <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1000 600">
        <g stroke="#2a2a2a" strokeWidth="1.5" fill="none">
          {/* North America */}
          <path d="M 150,200 Q 180,180 220,190 L 250,210 L 240,280 L 200,300 L 160,280 Z" />
          {/* South America */}
          <path d="M 200,320 L 240,340 L 250,420 L 220,450 L 200,430 Z" />
          {/* Europe */}
          <path d="M 460,180 L 500,200 L 510,230 L 490,250 L 450,240 Z" />
          {/* Africa */}
          <path d="M 480,280 L 520,300 L 530,400 L 500,420 L 470,380 Z" />
          {/* Asia */}
          <path d="M 550,180 Q 650,160 750,200 L 780,250 L 750,300 L 650,280 L 550,240 Z" />
          {/* Australia */}
          <path d="M 780,400 L 840,420 L 850,470 L 820,480 L 780,460 Z" />
        </g>
      </svg>

      {/* Network connections (animated lines) - cyan */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {CONNECTIONS.map(([from, to], idx) => {
          const node1 = NETWORK_NODES[from];
          const node2 = NETWORK_NODES[to];
          return (
            <motion.line
              key={idx}
              x1={`${node1.x}%`}
              y1={`${node1.y}%`}
              x2={`${node2.x}%`}
              y2={`${node2.y}%`}
              stroke="#00B8D4"
              strokeWidth="1"
              opacity="0.4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                delay: idx * 0.3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
            />
          );
        })}
      </svg>

      {/* Network nodes - white/cyan */}
      {NETWORK_NODES.map((node, idx) => (
        <motion.div
          key={node.name}
          className="absolute"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: idx * 0.1, duration: 0.5 }}
        >
          {/* Pulsing outer ring - cyan */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: node.size === "large" ? "24px" : node.size === "medium" ? "18px" : "14px",
              height: node.size === "large" ? "24px" : node.size === "medium" ? "18px" : "14px",
              background: "rgba(0, 184, 212, 0.3)",
              transform: "translate(-50%, -50%)",
              left: "50%",
              top: "50%",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: idx * 0.2,
            }}
          />
          
          {/* Core node - white/cyan gradient */}
          <div
            className="rounded-full shadow-[0_0_15px_rgba(0,184,212,0.8)]"
            style={{
              width: node.size === "large" ? "12px" : node.size === "medium" ? "8px" : "6px",
              height: node.size === "large" ? "12px" : node.size === "medium" ? "8px" : "6px",
              background: "linear-gradient(135deg, #ffffff, #00B8D4)",
            }}
          />
          
          {/* Node label - white text for large nodes */}
          {node.size === "large" && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white font-medium">
              {node.name}
            </div>
          )}
        </motion.div>
      ))}

      {/* Statistics overlay - bottom left */}
      <div className="absolute bottom-6 left-6">
        <motion.div
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="w-2 h-2 rounded-full bg-[#00B8D4] animate-pulse" />
          <span className="text-sm font-mono text-white">
            <span className="text-[#00B8D4] font-bold">{activeNodes}</span> {t.activeNodes}
          </span>
        </motion.div>
      </div>

      {/* Title - top center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <motion.h3
          className="text-2xl font-bold text-white text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t.title}
        </motion.h3>
      </div>
    </div>
  );
}
