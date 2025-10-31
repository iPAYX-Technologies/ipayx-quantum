import { motion } from 'framer-motion';
import { Star, Zap, DollarSign } from 'lucide-react';

interface RailRowProps {
  rail: any;
  index: number;
}

export function RailRow({ rail, index }: RailRowProps) {
  const isWinner = index === 0;
  
  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Volatility emoji
  const getVolatilityEmoji = (vol: number) => {
    if (vol < 0.15) return '🟢';
    if (vol < 0.35) return '🟡';
    return '🔴';
  };

  // Render stars for liquidity
  const renderStars = (liq: number) => {
    const stars = [];
    const fullStars = Math.floor(liq / 2);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 inline ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      );
    }
    return stars;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-b border-border/30 relative ${isWinner ? 'bg-primary/5' : ''}`}
    >
      <td className="py-3 px-2 font-medium relative">
        {isWinner && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 text-2xl"
          >
            🏆
          </motion.span>
        )}
        {rail.name}
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${getScoreColor(parseFloat(rail.score))}`}>
            {rail.score}
          </span>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${parseFloat(rail.score) >= 90 ? 'bg-green-400' : parseFloat(rail.score) >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${parseFloat(rail.score)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-1">
          {rail.baseFeePct < 0.5 && <DollarSign className="h-3 w-3 text-green-400" />}
          {rail.baseFeePct}%
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-1">
          {rail.latencyMin < 3 && <Zap className="h-3 w-3 text-yellow-400" />}
          {rail.latencyMin}min
        </div>
      </td>
      <td className="py-3 px-2">{rail.fxSpread}</td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-1">
          {renderStars(rail.liq)}
        </div>
      </td>
      <td className="py-3 px-2">
        <span className="flex items-center gap-1">
          {getVolatilityEmoji(rail.vol)} {rail.vol.toFixed(1)}
        </span>
      </td>
      <td className="py-3 px-2">
        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
          {rail.status}
        </span>
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        ${((rail.amount || 50000) * (1 - rail.baseFeePct / 100) * rail.quoteFX).toFixed(2)}
      </td>
    </motion.tr>
  );
}
