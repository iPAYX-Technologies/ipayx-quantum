import { motion } from "framer-motion";

export default function SatelliteOrbit3D() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "translateY(-80px)" }}>
      {/* Orbite principale en SVG */}
      <svg className="absolute" width="800" height="800" style={{ transform: "rotateX(70deg)" }}>
        <ellipse
          cx="400"
          cy="400"
          rx="360"
          ry="140"
          fill="none"
          stroke="#00B8D4"
          strokeWidth="2"
          opacity="0.25"
          strokeDasharray="10 6"
        />
        <ellipse
          cx="400"
          cy="400"
          rx="355"
          ry="135"
          fill="none"
          stroke="#4FC3F7"
          strokeWidth="1"
          opacity="0.15"
        />
      </svg>

      {/* Satellite en orbite */}
      <motion.div
        className="absolute"
        style={{
          width: "800px",
          height: "800px",
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateZ: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotateX(70deg) translateY(-360px)",
          }}
        >
          {/* Satellite professionnel */}
          <div className="relative">
            {/* Panneau solaire gauche */}
            <motion.div
              className="absolute -left-24 top-1/2 -translate-y-1/2 w-20 h-32"
              style={{
                background: "linear-gradient(135deg, #00B8D4 0%, #4FC3F7 50%, #0D7FB8 100%)",
                boxShadow: "0 0 30px rgba(0, 184, 212, 0.6), inset 0 0 20px rgba(79, 195, 247, 0.3)",
                opacity: 0.85,
              }}
              animate={{
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Grille solaire */}
              <div className="absolute inset-1 grid grid-cols-4 gap-0.5">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="bg-electric-blue/20 border border-[#00B8D4]/30" />
                ))}
              </div>
            </motion.div>

            {/* Hub central du satellite */}
            <div
              className="relative w-16 h-20 bg-gradient-to-b from-[#0D1F33] to-[#061018] border-2 border-[#00B8D4]/60"
              style={{
                boxShadow: "0 0 40px rgba(0, 184, 212, 0.5), inset 0 0 20px rgba(0, 184, 212, 0.2)",
              }}
            >
              {/* Antenne parabolique principale */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div 
                  className="w-12 h-12 rounded-full border-3 bg-gradient-to-br from-[#00B8D4]/30 to-[#4FC3F7]/10 relative"
                  style={{
                    borderColor: "#00B8D4",
                    borderWidth: "3px",
                  }}
                >
                  {/* Effet de transmission */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#00B8D4]"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#4FC3F7]"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: 0.5,
                      ease: "easeOut",
                    }}
                  />
                  {/* Centre de l'antenne */}
                  <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#00B8D4]"
                    style={{
                      boxShadow: "0 0 15px #00B8D4",
                    }}
                  />
                </div>
              </div>

              {/* Indicateurs de statut LED */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i < 2 ? "#00B8D4" : "#4FC3F7",
                      boxShadow: `0 0 10px ${i < 2 ? "#00B8D4" : "#4FC3F7"}`,
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.25,
                    }}
                  />
                ))}
              </div>

              {/* Bande centrale holographique */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1"
                style={{
                  background: "linear-gradient(90deg, transparent, #00B8D4, transparent)",
                  boxShadow: "0 0 20px #00B8D4",
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
            </div>

            {/* Panneau solaire droit */}
            <motion.div
              className="absolute -right-24 top-1/2 -translate-y-1/2 w-20 h-32"
              style={{
                background: "linear-gradient(135deg, #00B8D4 0%, #4FC3F7 50%, #0D7FB8 100%)",
                boxShadow: "0 0 30px rgba(0, 184, 212, 0.6), inset 0 0 20px rgba(79, 195, 247, 0.3)",
                opacity: 0.85,
              }}
              animate={{
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 1.5,
                ease: "easeInOut",
              }}
            >
              {/* Grille solaire */}
              <div className="absolute inset-1 grid grid-cols-4 gap-0.5">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="bg-electric-blue/20 border border-[#00B8D4]/30" />
                ))}
              </div>
            </motion.div>

            {/* Rayons de transmission vers le bas */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-40 origin-top"
                style={{
                  background: `linear-gradient(to bottom, rgba(0, 184, 212, ${0.6 - i * 0.2}), transparent)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scaleY: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Flux de données vers la planète (courbes) */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8;
        const delay = i * 0.4;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: i % 2 === 0 ? "#00B8D4" : "#4FC3F7",
              boxShadow: `0 0 12px ${i % 2 === 0 ? "#00B8D4" : "#4FC3F7"}`,
              top: "20%",
              left: "50%",
            }}
            animate={{
              x: [0, Math.cos(angle * Math.PI / 180) * 150, Math.cos(angle * Math.PI / 180) * 200],
              y: [0, Math.sin(angle * Math.PI / 180) * 80 + 100, Math.sin(angle * Math.PI / 180) * 100 + 200],
              opacity: [0, 1, 0.8, 0],
              scale: [0.5, 1, 1.2, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}
