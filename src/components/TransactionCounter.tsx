import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function TransactionCounter() {
  const [tps, setTps] = useState(3247);
  const [history, setHistory] = useState<number[]>([3200, 3180, 3220, 3247]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTps((prev) => {
        const change = Math.floor(Math.random() * 800) - 400;
        const newTps = Math.max(2200, Math.min(4800, prev + change));
        setHistory((h) => [...h.slice(-19), newTps]);
        return newTps;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Radar scan effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, rgba(0, 184, 212, 0.15) 50%, transparent 100%)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Container principal */}
      <motion.div
        className="relative bg-gradient-to-br from-[#0D1F33]/80 to-[#061018]/60 backdrop-blur-md rounded-2xl px-8 py-6 border"
        style={{
          borderColor: "#00B8D4",
          borderWidth: "2px",
        }}
        animate={{
          boxShadow: [
            "0 0 20px rgba(0, 184, 212, 0.3)",
            "0 0 40px rgba(0, 184, 212, 0.5)",
            "0 0 20px rgba(0, 184, 212, 0.3)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        {/* Status indicator */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              background: "#00B8D4",
              boxShadow: "0 0 12px #00B8D4",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span className="text-[#B0BEC5] text-sm font-medium tracking-wide uppercase">
            Live Network Status
          </span>
        </div>

        {/* TPS Counter avec count-up effect */}
        <div className="flex items-baseline gap-3 mb-2">
          <motion.span
            key={tps}
            className="text-7xl font-bold bg-gradient-to-r from-[#00B8D4] to-[#4FC3F7] bg-clip-text text-transparent"
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {tps.toLocaleString()}
          </motion.span>
          <span className="text-2xl text-[#78909C] font-light">TPS</span>
        </div>

        {/* Label */}
        <p className="text-[#78909C] text-sm tracking-wider mb-4">
          Transactions Per Second
        </p>

        {/* Spark line graph */}
        <div className="relative h-12 flex items-end gap-1">
          {history.map((value, i) => {
            const height = ((value - 2200) / (4800 - 2200)) * 100;
            const isRecent = i >= history.length - 3;
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${height}%`,
                  background: isRecent
                    ? "linear-gradient(to top, #00B8D4, #4FC3F7)"
                    : "linear-gradient(to top, #0D7FB8, #00B8D4)",
                  opacity: 0.3 + (i / history.length) * 0.7,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5 }}
              />
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
