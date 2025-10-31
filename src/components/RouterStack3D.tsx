import { motion } from "framer-motion";

export default function RouterStack3D() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center perspective-1000">
      <motion.div
        className="relative w-48 h-48"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: [0, 360] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Multiple router layers */}
        {[0, 1, 2, 3, 4].map((layer) => (
          <motion.div
            key={layer}
            className="absolute inset-0 border border-primary/30 rounded-lg bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm"
            style={{
              transform: `translateZ(${layer * 20 - 40}px)`,
              transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.7, 0.3],
              scale: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: layer * 0.2,
              ease: "easeInOut",
            }}
          >
            {/* Connection nodes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
            </div>
            
            {/* Corner nodes */}
            {[[0, 0], [100, 0], [0, 100], [100, 100]].map(([x, y], i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-secondary rounded-full"
                style={{ left: `${x}%`, top: `${y}%` }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3 + layer * 0.1,
                }}
              />
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
