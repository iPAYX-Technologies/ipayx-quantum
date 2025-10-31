import { motion } from "framer-motion";
import QRCode from "react-qr-code";

export default function QuantumQRCode({ value = "https://ipayx-protocol.com" }: { value?: string }) {
  return (
    <div className="relative">
      <motion.div
        className="relative p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Animated corners */}
        {[[0, 0], [0, 100], [100, 0], [100, 100]].map(([x, y], i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 border-2 border-primary rounded-sm"
            style={{
              left: x === 0 ? '8px' : 'auto',
              right: x === 100 ? '8px' : 'auto',
              top: y === 0 ? '8px' : 'auto',
              bottom: y === 100 ? '8px' : 'auto',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* QR Code */}
        <div className="relative bg-white p-4 rounded-lg">
          <QRCode value={value} size={200} />
        </div>

        {/* Scanning line effect */}
        <motion.div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{ top: '20%' }}
          animate={{ top: ['20%', '80%', '20%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 -z-10 blur-xl opacity-30 bg-gradient-to-br from-primary to-secondary rounded-2xl"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
