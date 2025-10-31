import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { githubBackend } from "@/services/github-backend-reader";
import { initPlugins, listPlugins } from "@/plugins/registry";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { scoreRail, RailInput, SCORING_PRESETS, ScoringWeights } from "@/lib/scoring";
import { RailRow } from "@/components/RailRow";
import scenariosData from "@/data/scenarios.json";
import { Info, Zap, DollarSign, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Demo() {
  const { t } = useLanguage();
  
  // Initialize plugins on mount
  useEffect(() => {
    initPlugins().then(() => {
      const plugins = listPlugins();
      console.log(`✅ Plugins loaded:`, plugins.map(p => p.name));
      toast.success(`Plugin system ready: ${plugins.length} providers`);
    });
  }, []);
  
  const [kycMode, setKycMode] = useState(true);
  const [isTestnet, setIsTestnet] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState("cad-usd");
  const [amount, setAmount] = useState("100000");
  const [results, setResults] = useState<any[]>([]);
  
  // New filters
  const [strategy, setStrategy] = useState<keyof typeof SCORING_PRESETS>("balanced");
  const [speedCostBalance, setSpeedCostBalance] = useState([50]);
  const [enabledProviders, setEnabledProviders] = useState({
    bridge: true,
    stellar: true,
    tron: true,
    traditional: true
  });

  // Eliza AI state
  const [elizaRecommendation, setElizaRecommendation] = useState<any>(null);
  const [elizaLoading, setElizaLoading] = useState(false);

  const runSimulation = async () => {
    const scenario = scenariosData.find(s => s.id === selectedCorridor);
    if (!scenario) return;

    try {
      // Utiliser le reader GitHub au lieu de l'edge function 'quote'
      const data = await githubBackend.simulateMetaRouter({
        fromNetwork: scenario.from,
        toNetwork: scenario.to,
        asset: 'USDC',
        amount: parseInt(amount)
      });

      // Apply strategy weights
      let weights: ScoringWeights = SCORING_PRESETS[strategy];
      
      // Adjust weights based on speed/cost slider
      const speedFactor = speedCostBalance[0] / 50; // 0-2 range
      weights = {
        ...weights,
        feeWeight: weights.feeWeight * (2 - speedFactor * 0.5),
        speedWeight: weights.speedWeight * (1 + speedFactor * 0.5)
      };

      // Filter by provider type
      const filteredRoutes = data.routes.filter((route: any) => {
        const provider = route.provider?.toLowerCase() || 'traditional';
        return enabledProviders[provider as keyof typeof enabledProviders];
      });

      // Recalculate scores with selected weights
      const formattedResults = filteredRoutes.map((route: any) => {
        const railInput: RailInput = {
          name: route.rail,
          feePct: route.feePct,
          etaMin: route.etaMin,
          quoteFX: route.quoteFX,
          oracleFX: route.oracleFX,
          liq: route.liq,
          vol: route.vol,
          status: 'live'
        };
        
        const newScore = scoreRail(railInput, weights).toFixed(1);
        
        return {
          name: route.rail,
          score: newScore,
          baseFeePct: route.feePct,
          latencyMin: route.etaMin,
          quoteFX: route.quoteFX,
          oracleFX: route.oracleFX,
          fxSpread: route.fxSpread,
          liq: route.liq,
          vol: route.vol,
          status: route.status,
          amount: route.amount,
          amountOut: route.amountOut
        };
      });

      // Re-sort by new score
      formattedResults.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

      setResults(formattedResults);
      
      toast.success("Simulation complete", {
        description: `Found ${formattedResults.length} routes using ${strategy} strategy`
      });
    } catch (error) {
      console.error('Error running simulation:', error);
      toast.error('Simulation failed', {
        description: 'Could not connect to GitHub backend'
      });
    }
  };

  const runElizaOrchestrator = async () => {
    const scenario = scenariosData.find(s => s.id === selectedCorridor);
    if (!scenario) return;

    setElizaLoading(true);
    setElizaRecommendation(null);

    try {
      console.log('🤖 Calling Eliza AI Orchestrator...');
      
      const { data, error } = await supabase.functions.invoke('eliza-orchestrator', {
        body: {
          fromNetwork: scenario.from,
          toNetwork: scenario.to,
          asset: 'USDC',
          amount: parseInt(amount)
        }
      });

      if (error) throw error;

      console.log('✅ Eliza response:', data);
      setElizaRecommendation(data);
      
      toast.success(`🤖 Eliza AI: ${data.bestRoute}`, {
        description: data.reasoning.substring(0, 100) + '...'
      });
    } catch (error) {
      console.error('❌ Eliza error:', error);
      toast.error('Eliza AI Failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setElizaLoading(false);
    }
  };

  const explainRoute = () => {
    if (results.length === 0) {
      toast.info(t.demo.explain, {
        description: "Please run a simulation first"
      });
      return;
    }
    const winner = results[0];
    toast.success(`Best Route: ${winner.name}`, {
      description: `Score: ${winner.score} | Fee: ${winner.baseFeePct}% | ETA: ${winner.latencyMin}min`
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Developer Sandbox</h1>
        <p className="text-muted-foreground mb-6">Testing interface for developers - test routing strategies and compare results</p>
        
        

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-border/50 p-6 space-y-6 h-fit">
            {/* Compliance Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="kyc-mode" className="text-base">
                  Compliance Mode
                </Label>
                <span className="text-xs text-muted-foreground" title="Simulation only - Real users are always KYC verified via partners">
                  ℹ️
                </span>
              </div>
              <Switch id="kyc-mode" checked={kycMode} onCheckedChange={setKycMode} />
            </div>

            {/* Testnet/Mainnet Toggle */}
            <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="space-y-1">
                <Label htmlFor="network-mode" className="text-base font-semibold">
                  {isTestnet ? "🧪 Testnet Mode" : "⚡ Mainnet Mode"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isTestnet 
                    ? "Using test networks (no real funds)" 
                    : "⚠️ LIVE transactions with real assets"}
                </p>
              </div>
              <Switch 
                id="network-mode" 
                checked={!isTestnet} 
                onCheckedChange={(checked) => setIsTestnet(!checked)} 
              />
            </div>

            {/* Strategy Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Strategy</Label>
              <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as keyof typeof SCORING_PRESETS)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <Label htmlFor="balanced" className="flex items-center gap-2 cursor-pointer">
                    <Target className="h-4 w-4 text-primary" />
                    Balanced
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fast" id="fast" />
                  <Label htmlFor="fast" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    Speed First
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheap" id="cheap" />
                  <Label htmlFor="cheap" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    Cost First
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Speed vs Cost Slider */}
            <div className="space-y-3">
              <Label className="text-sm">Priority: Speed vs Cost</Label>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Cheapest</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Fastest</span>
                </div>
              </div>
              <Slider
                value={speedCostBalance}
                onValueChange={setSpeedCostBalance}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Provider Filters */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Rail Providers</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bridge" 
                    checked={enabledProviders.bridge}
                    onCheckedChange={(checked) => 
                      setEnabledProviders(prev => ({ ...prev, bridge: checked as boolean }))
                    }
                  />
                  <Label htmlFor="bridge" className="cursor-pointer">Bridge Networks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stellar" 
                    checked={enabledProviders.stellar}
                    onCheckedChange={(checked) => 
                      setEnabledProviders(prev => ({ ...prev, stellar: checked as boolean }))
                    }
                  />
                  <Label htmlFor="stellar" className="cursor-pointer">Network Alpha</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tron" 
                    checked={enabledProviders.tron}
                    onCheckedChange={(checked) => 
                      setEnabledProviders(prev => ({ ...prev, tron: checked as boolean }))
                    }
                  />
                  <Label htmlFor="tron" className="cursor-pointer">Network Beta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="traditional" 
                    checked={enabledProviders.traditional}
                    onCheckedChange={(checked) => 
                      setEnabledProviders(prev => ({ ...prev, traditional: checked as boolean }))
                    }
                  />
                  <Label htmlFor="traditional" className="cursor-pointer">Traditional Rails</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.demo.corridor}</Label>
              <Select value={selectedCorridor} onValueChange={setSelectedCorridor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chicago-malaysia">🌍 Chicago → Malaysia (100K USD)</SelectItem>
                  <SelectItem value="nigeria-canada">🌍 Nigeria → Montreal (250K USD)</SelectItem>
                  <SelectItem value="cad-usd">CAD → USD</SelectItem>
                  <SelectItem value="usd-inr">USD → INR</SelectItem>
                  <SelectItem value="usd-mxn">USD → MXN</SelectItem>
                  <SelectItem value="eur-brl">EUR → BRL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-lg">{t.demo.amount}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[parseInt(amount)]}
                  onValueChange={([v]) => setAmount(v.toString())}
                  min={100000}
                  max={10000000}
                  step={100000}
                  className="flex-1"
                />
                <span className="text-xl font-bold text-primary min-w-[100px]">
                  ${parseInt(amount).toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              onClick={runSimulation}
              className="w-full bg-gradient-primary border-0 shadow-glow-violet hover:shadow-glow-blue"
            >
              Run Simulation
            </Button>

            <Button
              onClick={runElizaOrchestrator}
              disabled={elizaLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 shadow-lg"
            >
              {elizaLoading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Eliza AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  🤖 Ask Eliza AI
                </>
              )}
            </Button>

            <Button
              onClick={explainRoute}
              variant="outline"
              className="w-full border-primary/30"
            >
              <Info className="mr-2 h-4 w-4" />
              {t.demo.explain}
            </Button>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50 p-6">
            <h2 className="text-2xl font-semibold mb-6">{t.demo.results}</h2>
            
            {/* Eliza AI Recommendation Badge */}
            {elizaRecommendation && (
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-xl border-2 border-purple-500/30 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-purple-400">🤖 Eliza AI Recommendation</h3>
                      <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm font-semibold text-purple-300">
                        Score: {elizaRecommendation.score}/100
                      </span>
                    </div>
                    <p className="text-base font-semibold text-cyan-300">
                      Best Route: <span className="text-white">{elizaRecommendation.bestRoute}</span>
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {elizaRecommendation.reasoning}
                    </p>
                    {elizaRecommendation.rankings && (
                      <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <p className="text-xs font-semibold text-purple-300 mb-2">Top 3 Routes:</p>
                        <div className="space-y-1">
                          {elizaRecommendation.rankings.slice(0, 3).map((r: any) => (
                            <div key={r.provider} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                #{r.rank} {r.provider}
                              </span>
                              <span className="text-cyan-400 font-mono">{r.score}/100</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                      <span className="px-2 py-1 bg-purple-500/10 rounded">
                        Model: {elizaRecommendation.model || 'google/gemini-2.5-flash'}
                      </span>
                      <span className="px-2 py-1 bg-cyan-500/10 rounded">
                        Mode: {elizaRecommendation.mode || 'ai'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Configure parameters and click "Run Simulation"
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2">{t.demo.table.rail}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.score}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.fee}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.eta}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.fxSpread}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.liquidity}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.volatility}</th>
                        <th className="text-left py-3 px-2">{t.demo.table.status}</th>
                        <th className="text-left py-3 px-2">Amount Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((rail, index) => (
                        <RailRow key={rail.name} rail={rail} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}