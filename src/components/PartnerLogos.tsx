import { motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import hederaLogo from "@/assets/partners/hedera-logo.png";
import xrplLogo from "@/assets/partners/xrpl-logo.svg";

type Partner = {
  name: string;
  slug?: string;
  isImage?: boolean;
  imageSrc?: string;
  isBadge?: boolean;
};

const partners: Partner[] = [
  { name: "Chainlink", slug: "chainlink" },
  { name: "LayerZero", isBadge: true },
  { name: "Axelar", isBadge: true },
  { name: "Wormhole", isBadge: true },
  { name: "Hyperlane", isBadge: true },
  { name: "Hedera", isImage: true, imageSrc: hederaLogo },
  { name: "Tron", slug: "tron" },
  { name: "SEI", isBadge: true },
  { name: "Base", slug: "base" },
  { name: "Solana", slug: "solana" },
  { name: "Circle", slug: "circle" },
  { name: "Stellar", slug: "stellar" },
  { name: "Coinbase", slug: "coinbase" },
  { name: "XRPL", isImage: true, imageSrc: xrplLogo },
];

const PartnerLogo = ({ partner }: { partner: Partner }) => {
  const [loaded, setLoaded] = useState(true);

  // Local image asset (Hedera, XRPL)
  if (partner.isImage && partner.imageSrc) {
    return (
      <div className="flex-shrink-0 w-28 h-28 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-300">
        <img
          src={partner.imageSrc}
          alt={partner.name}
          className="w-20 h-20 object-contain"
        />
      </div>
    );
  }

  // Badge text (LayerZero, Axelar, Wormhole, Hyperlane, SEI)
  if (partner.isBadge) {
    return (
      <div className="flex-shrink-0 w-28 h-28 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-300">
        <Badge variant="outline" className="px-4 py-2 text-xs font-semibold border-white/20 bg-white/5 text-white/90 hover:bg-white/10">
          {partner.name}
        </Badge>
      </div>
    );
  }

  // SimpleIcons CDN (Chainlink, Tron, Base, Solana, Circle, Stellar, Coinbase)
  return (
    <div className="flex-shrink-0 w-28 h-28 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-300">
      {loaded ? (
        <img
          src={`https://cdn.simpleicons.org/${partner.slug}/FFFFFF`}
          alt={partner.name}
          className="w-20 h-20 object-contain"
          onError={() => setLoaded(false)}
        />
      ) : (
        <Badge variant="outline" className="px-4 py-2 text-xs font-semibold border-white/20 bg-white/5 text-white/90">
          {partner.name}
        </Badge>
      )}
    </div>
  );
};

export default function PartnerLogos() {
  return (
    <section className="relative bg-gradient-to-b from-[#061c3d] to-[#000814] py-12 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-sky-300 font-semibold text-lg tracking-wide uppercase mb-8"
      >
        Powered By
      </motion.h2>

      {/* Carrousel animé */}
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-12 partner-scroll">
          {partners.concat(partners).map((partner, index) => (
            <PartnerLogo key={index} partner={partner} />
          ))}
        </div>
      </div>

      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.15),transparent_60%)] pointer-events-none" />

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .partner-scroll {
          width: calc(200%);
          animation: scroll 20s linear infinite;
        }
        .partner-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
