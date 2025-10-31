// 🔥 CACHE BUSTER: 2025-10-29-13:50:00 - VERSION INDICATOR ADDED - If you see green "VERSION: 2025-10-29-CACHE-CLEARED" badge, you have the LATEST version
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { calcSavings, calcLegacyRange, calcIpayxFee, fmtCurrency } from "@/lib/savingsWidget.config";

import QuantumQRCode from "@/components/QuantumQRCode";
import SmartContactForm from "@/components/SmartContactForm";
import PlanetEarth3D from "@/components/PlanetEarth3D";
import DataFlowParticles from "@/components/DataFlowParticles";
import TransactionCounter from "@/components/TransactionCounter";
import ROICalculator from "@/components/ROICalculator";

import ProtocolStack from "@/components/ProtocolStack";
import ExecutiveMetrics from "@/components/ExecutiveMetrics";
import LiveMetrics from "@/components/LiveMetrics";
import GlobalNetworkMapFlat from "@/components/GlobalNetworkMapFlat";
import ChatbotWidget from "@/components/ChatbotWidget";
import QuantumHub3D from "@/components/QuantumHub3D";
import PartnerLogos from "@/components/PartnerLogos";

import multiChainOcean from "@/assets/multi-chain-ocean.jpg";
import aiDataEarth from "@/assets/ai-data-earth.jpg";
import onrampHorizon from "@/assets/onramp-horizon.jpg";
import vegasConference from "@/assets/vegas-conference.jpeg";

// Partner logos URLs
const partnerLogos = {
  hedera: "https://seeklogo.com/images/H/hedera-hashgraph-hbar-logo-9BA670C222-seeklogo.com.png",
  tron: "https://altcoinsbox.com/wp-content/uploads/2023/01/tron-logo.svg",
  xrpl: "https://www.svgrepo.com/show/428657/ripple-xrp-cryptocurrency.svg",
  stellar: "https://seeklogo.com/images/S/stellar-xlm-logo-DF4AA2C5A6-seeklogo.com.png",
  polygon: "https://seeklogo.com/images/P/polygon-matic-logo-86F4D6D773-seeklogo.com.png",
  circle: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg",
};

// Stats initialization
function seedStats() {
  return {
    volume: 14_820_000_000,
    tps: 12_930_000,
    corridors: 109,
  };
}

function driftStats(s: ReturnType<typeof seedStats>) {
  return {
    volume: s.volume + Math.random() * 50_000_000 - 25_000_000,
    tps: s.tps + Math.random() * 100_000 - 50_000,
    corridors: Math.floor(105 + Math.random() * 10),
  };
}

function formatUSD(n: number) {
  if (n >= 1e9) return `$${n % 1e9 === 0 ? (n / 1e9).toFixed(0) : (n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${n % 1e6 === 0 ? (n / 1e6).toFixed(0) : (n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatInt(n: number) {
  return Math.floor(n).toLocaleString();
}

function formatTPS(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M/SEC`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K/SEC`;
  return `${n.toFixed(0)}/SEC`;
}

export default function IPayXLanding() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(seedStats());
  const [annualAmount, setAnnualAmount] = useState(100000); // $1M default

  useEffect(() => {
    const drift = setInterval(() => setStats((s) => driftStats(s)), 3000);
    return () => clearInterval(drift);
  }, []);

  // Calculate savings using centralized config
  const ipayxCost = calcIpayxFee(annualAmount);
  const legacyCosts = calcLegacyRange(annualAmount);
  const savingsRange = calcSavings(annualAmount);

  return (
    <>
      <MaintenanceBanner />
      <div className="min-h-screen bg-background text-foreground">
      {/* HERO SECTION - PROFESSIONAL GRADE */}
      <section 
        className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(217, 71%, 9%) 0%, hsl(214, 62%, 12%) 30%, hsl(207, 78%, 20%) 70%, hsl(193, 82%, 35%) 100%)"
        }}
      >
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>
        
        {/* Radial glow effect */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-40" />
        
        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <motion.div 
            className="flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Contenu Textuel + Calculator */}
            <motion.div
              className="space-y-6 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Titre Principal - IMPACT MAXIMUM */}
              <div className="space-y-4 mb-8">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                  <span className="block bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent drop-shadow-2xl">
                    {t.hero.title}
                  </span>
                </h1>
                
                {/* Sous-titre - Plus visible */}
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-accent/90 drop-shadow-lg">
                  {t.hero.subtitle}
                </p>
                
                {/* Tagline professionnel */}
                <div className="flex items-center justify-center gap-3 text-foreground/70 text-sm md:text-base">
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary"></span>
                  <span className="font-medium tracking-wide">Cross-Chain Payment Infrastructure</span>
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary"></span>
                </div>
              </div>
              
              {/* ROI Calculator Card (version compacte) */}
              <Card className="bg-card/80 backdrop-blur-sm p-6 space-y-4 border border-primary/20">
              {/* Slider */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-foreground">
                    {t.savingsWidget.annualVolume} : {formatUSD(annualAmount)}
                  </Label>
                  <Slider
                    value={[annualAmount]}
                    onValueChange={(value) => setAnnualAmount(value[0])}
              min={100000}
              max={100000000}
              step={100000}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm text-muted-foreground">ou entrez:</span>
                    <input
                      type="number"
                      value={annualAmount}
                      onChange={(e) => setAnnualAmount(Number(e.target.value))}
                      min={100000}
                      max={100000000}
                      step={100000}
                      className="w-40 px-3 py-2 rounded-lg border border-primary/30 bg-background text-foreground text-center"
                    />
                  </div>
                </div>

                {/* Comparative Table - FOCUS ON CLIENT SAVINGS */}
                <Table>
                  <TableBody>
                    {/* Traditional Banking - All-in cost */}
                    <TableRow>
                      <TableCell className="font-bold">Traditional Banking</TableCell>
                      <TableCell className="font-semibold text-muted-foreground">2.5-3.0% all-in</TableCell>
                      <TableCell className="text-right font-semibold text-red-400">
                        {fmtCurrency(annualAmount * 0.028, language)}
                      </TableCell>
                    </TableRow>

                    {/* iPAYX Breakdown */}
                    <TableRow className="bg-muted/5">
                      <TableCell className="font-medium">iPAYX best route found</TableCell>
                      <TableCell className="text-sm text-muted-foreground">~1.5% partner fee</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtCurrency(annualAmount * 0.015, language)}
                      </TableCell>
                    </TableRow>

                    <TableRow className="bg-primary/5">
                      <TableCell className="pl-8 text-sm">+ iPAYX protocol fee</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">0.7%</TableCell>
                      <TableCell className="text-right text-primary">
                        {fmtCurrency(annualAmount * 0.007, language)}
                      </TableCell>
                    </TableRow>

                    {/* Total iPAYX */}
                    <TableRow className="border-t-2 border-primary/30 bg-primary/10">
                      <TableCell className="font-bold text-primary">iPAYX Total</TableCell>
                      <TableCell className="font-semibold text-primary">2.2%</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {fmtCurrency(annualAmount * 0.022, language)}
                      </TableCell>
                    </TableRow>

                    {/* Savings */}
                    <TableRow className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-t-2 border-cyan-500/50">
                      <TableCell colSpan={2} className="font-bold text-cyan-400 text-lg">
                        💰 YOU SAVE (vs traditional)
                      </TableCell>
                      <TableCell className="text-right text-cyan-400 font-bold text-lg">
                        {fmtCurrency(annualAmount * 0.006, language)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Savings Message */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-base font-semibold text-cyan-400">
                      {t.hero.savingsMessage.replace('{amount}', fmtCurrency(savingsRange.max, language))}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                </div>
              </Card>

              {/* CTA Buttons - Trio Professionnel */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button
                  size="lg"
                  onClick={() => navigate("/quote")}
                  className="flex-1 text-white font-bold text-lg px-8 py-6 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                  }}
                >
                  Calculate Your Savings →
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate("/demo")}
                  variant="outline"
                  className="flex-1 border-2 border-primary/50 text-primary hover:bg-primary/10 font-bold text-lg px-8 py-6 transition-all duration-300 hover:scale-105"
                >
                  {t.hero.ctaButton}
                </Button>
              </div>

              {/* Pay with Coinbase CTA - UPDATED */}
              <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-2 border-primary/30">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-primary">
                    {language === 'fr' ? '💳 Prêt à payer?' : '💳 Ready to Pay?'}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {language === 'fr' 
                      ? 'Payez par Carte, Apple Pay ou Interac e-Transfer' 
                      : 'Pay with Card, Apple Pay, or Interac e-Transfer'}
                  </p>
                  
                  {/* VERSION INDICATOR - Confirms you're seeing the NEW version */}
                  <div className="inline-block px-4 py-2 bg-green-500/20 border-2 border-green-500 rounded-lg">
                    <p className="text-sm font-mono font-bold text-green-600 dark:text-green-400">
                      ✅ VERSION: 2025-10-29-CACHE-CLEARED
                    </p>
                  </div>
                  
                  {/* Disclaimer bilingue */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {language === 'fr'
                        ? '🔒 iPAYX ne détient pas de fonds. Nous routons les paiements via des partenaires réglementés.'
                        : '🔒 iPAYX does not hold funds. We route payments through regulated partners.'}
                    </p>
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={() => navigate("/quote")}
                    className="w-full md:w-auto text-white font-bold text-lg px-12 py-6 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)',
                    }}
                  >
                    {language === 'fr' ? '🚀 Commencer maintenant' : '🚀 Start Payment Now'}
                  </Button>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>💳 {language === 'fr' ? 'Cartes' : 'Cards'}</span>
                    <span>•</span>
                    <span>🍎 Apple Pay</span>
                    <span>•</span>
                    <span>🇨🇦 Interac e-Transfer</span>
                    <span>•</span>
                    <span>🌍 {language === 'fr' ? '150+ Pays' : '150+ Countries'}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {language === 'fr'
                      ? 'Propulsé par Coinbase Commerce • Transmetteur d\'argent licencié'
                      : 'Powered by Coinbase Commerce • Licensed Money Transmitter'}
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Press & Leadership Section - Vegas */}
      <section className="py-24 px-6 bg-gradient-to-b from-card/30 via-card/10 to-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="px-6 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-bold tracking-wider">
                LEADERSHIP & INNOVATION
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary via-accent to-electric-blue bg-clip-text text-transparent">
              Global Impact
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              Presenting cutting-edge cross-chain infrastructure at the world's premier blockchain conferences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Photo Vegas à gauche */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(30,136,229,0.3)] border border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <img 
                src={vegasConference}
                alt="iPAYX Protocol Founder presenting at Las Vegas 2025 - Major Blockchain & DeFi Summit" 
                className="w-full h-[450px] object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
                <div className="max-w-xl">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    Las Vegas 2025
                  </h3>
                  <p className="text-accent text-base md:text-lg font-semibold mb-3">
                    Blockchain & DeFi Summit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-primary/90 text-white rounded-full text-xs font-bold">
                      Keynote Speaker
                    </span>
                    <span className="px-3 py-1.5 bg-accent/90 text-white rounded-full text-xs font-bold">
                      Cross-Chain
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Animation 3D IOTA à droite */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(30,136,229,0.3)] border border-primary/20 bg-gradient-to-br from-slate-900 to-black"
            >
              <div className="h-[450px] flex items-center justify-center">
                <QuantumHub3D />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
                <div className="max-w-xl">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    Quantum Network
                  </h3>
                  <p className="text-accent text-base md:text-lg font-semibold mb-3">
                    Real-time Cross-Chain Infrastructure
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-primary/90 text-white rounded-full text-xs font-bold">
                      150+ Chains
                    </span>
                    <span className="px-3 py-1.5 bg-electric-blue/90 text-white rounded-full text-xs font-bold">
                      AI Routing
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3 FEATURE CARDS WITH IMAGES */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ImageFeature
              img={multiChainOcean}
              title="Multi-Chain Settlement"
              desc="Seamless transactions across 150+ blockchain networks with instant finality"
            />
            <ImageFeature
              img={aiDataEarth}
              title="AI-Powered Routing"
              desc="Smart algorithms optimize every transfer for speed, cost, and security"
            />
            <ImageFeature
              img={onrampHorizon}
              title="Global Coverage"
              desc="Instant cross-border transfers across 180+ countries with multi-rail smart routing"
            />
          </motion.div>
        </div>
      </section>


      {/* EXECUTIVE BRIEFING SECTION - CEO/CFO SCRIPT */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-primary via-accent to-electric-blue bg-clip-text text-transparent">
              {t.executiveBriefing.title}
            </h2>
            <p className="text-center text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
              {t.executiveBriefing.subtitle}
            </p>
          </motion.div>

          {/* The Problem */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t.executiveBriefing.problemTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {t.executiveBriefing.problemPoints.map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border/40 bg-card/50"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                >
                  <div className="text-4xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground mt-2">{item.text}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* The Solution */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t.executiveBriefing.solutionTitle}
            </h3>
            <div className="space-y-4">
              {t.executiveBriefing.solutionPoints.map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <div className="font-bold text-foreground text-lg">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Why CFOs Choose iPayX */}
          <motion.div
            className="mb-16 p-8 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-3xl font-bold text-foreground mb-6">
              {t.executiveBriefing.whyChooseTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {t.executiveBriefing.whyChoosePoints.map((item, idx) => (
                <motion.div
                  key={idx}
                  className="flex gap-3 items-start"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-background font-bold flex items-center justify-center">
                    {item.num}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enterprise Security */}
          <motion.div
            className="text-center mb-8 p-6 rounded-lg border border-border/30 bg-card/30"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="text-2xl font-bold text-foreground mb-4">
              {t.executiveBriefing.securityTitle}
            </h4>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {t.executiveBriefing.securityBadges.map((badge, idx) => (
                <span key={idx}>{badge}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARTNER LOGOS */}
      <PartnerLogos />

      {/* LIVE METRICS */}
      <section className="py-16 px-6 bg-card/20">
        <LiveMetrics />
      </section>

      {/* EXECUTIVE METRICS */}
      <section className="py-16 px-6">
        <ExecutiveMetrics />
      </section>


      {/* ROI CALCULATOR SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ROICalculator />
          </motion.div>
        </div>
      </section>

      {/* PROTOCOL STACK DIAGRAM - Style Ethena */}
      <section className="py-24 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {language === 'en' ? 'Protocol Architecture' : 'Architecture du Protocole'}
          </motion.h2>
          
          <motion.p
            className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {language === 'en' 
              ? 'Three integrated layers enabling quantum-speed cross-border payments'
              : 'Trois couches intégrées permettant des paiements transfrontaliers à vitesse quantique'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ProtocolStack />
          </motion.div>
        </div>
      </section>



      {/* CFO COMPARISON TABLE */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {t.comparison.title}
          </motion.h2>

          <Card className="overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left p-4 text-muted-foreground font-semibold">
                      {language === 'en' ? 'Metric' : 'Indicateur'}
                    </th>
                    <th className="text-left p-4 text-muted-foreground font-semibold">{t.comparison.oldModel}</th>
                    <th className="text-left p-4 text-primary font-semibold">{t.comparison.ipayx}</th>
                  </tr>
                </thead>
                <tbody>
                  {t.comparison.rows.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/20 hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-medium text-foreground">{row.label}</td>
                      <td className="p-4 text-muted-foreground">{row.old}</td>
                      <td className="p-4 text-primary font-semibold">{row.new}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* READY FOR QUANTUM LIQUIDITY SECTION */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Right: Text + QR Code */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {language === 'en' ? 'Ready for Quantum Liquidity?' : 'Prêt pour la Liquidité Quantique?'}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {language === 'en' 
                  ? 'Join the network of enterprises transforming global payments with blockchain infrastructure.'
                  : 'Rejoignez le réseau d\'entreprises transformant les paiements mondiaux avec l\'infrastructure blockchain.'}
              </p>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {language === 'en' ? 'iPAYX Protocol Benefits:' : 'Avantages du Protocole iPAYX:'}
                </h3>
                <ul className="space-y-3">
                  {[
                    language === 'en' ? 'Meta-Router: 0.7% fixed fees across all corridors' : 'Meta-Router: 0,7% de frais fixes sur tous les corridors',
                    language === 'en' ? 'Instant Settlement: 8-second finality vs 3-5 days traditional' : 'Règlement Instantané: 8 secondes vs 3-5 jours traditionnel',
                    language === 'en' ? 'Multi-Rail Infrastructure: Tron, Stellar, Circle CCTP, Hedera' : 'Infrastructure Multi-Rail: Tron, Stellar, Circle CCTP, Hedera',
                    language === 'en' ? 'Enterprise Security: Smart contract audited, Non-custodial architecture' : 'Sécurité Entreprise: Contrats intelligents audités, Architecture non-dépositaire',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center lg:justify-start">
                <QuantumQRCode value="https://ipayx-protocol.com/get-started" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ATARI RADAR SECTION */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlobalNetworkMapFlat t={t.networkMap} />
          </motion.div>
        </div>
      </section>

      {/* LEAD CAPTURE SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SmartContactForm lang={language} t={t.smartContact} />
          </motion.div>
        </div>
      </section>

      {/* METRICS SECTION - MOVED TO BOTTOM */}
      <section className="relative py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {t.metrics.title}
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-8">
            <MetricCard value={formatUSD(stats.volume)} label={t.metrics.volume24h} />
            <MetricCard value={formatTPS(stats.tps)} label={t.metrics.tps} />
            <MetricCard value={formatInt(stats.corridors)} label={t.metrics.corridors} />
          </div>
        </div>
      </section>

      {/* CHATBOT WIDGET */}
      {/* Network Status Widget */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Live Network Status</h2>
            <p className="text-muted-foreground">Real-time iPAYX V4 infrastructure metrics</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard value="6" label="Active Plugins" />
            <MetricCard value="9" label="Meta-Router Rails" />
            <MetricCard value="109" label="Global Corridors" />
            <MetricCard value="99.8%" label="Uptime" />
          </div>

          <div className="mt-8 text-center">
            <Button size="lg" onClick={() => navigate('/demo')}>
              View Live Demo
            </Button>
          </div>
        </div>
      </section>


      {/* Messari Stablecoins Section - REMOVED */}

      <ChatbotWidget />
    </div>
    </>
  );
}

// IMAGE FEATURE COMPONENT
function ImageFeature({ img, title, desc }: { img: string; title: string; desc: string }) {
  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden border border-border/40 hover:border-primary/30 transition-all shadow-[0_0_20px_rgba(0,184,212,0.3)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative h-64">
        <img 
          src={img} 
          alt={title} 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-background/80 to-transparent" />
      </div>
      
      <div className="relative p-6 bg-card/80 backdrop-blur-sm border-t border-primary/20">
        <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// METRIC CARD COMPONENT
function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      className="text-center p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-4xl font-bold text-primary mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
