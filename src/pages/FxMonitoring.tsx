import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getFxWatcher, type CorridorState, type SignalSource, type Pair } from '@/agents/fx-watcher';
import { Activity, AlertTriangle, RefreshCw, Zap, Clock, TrendingUp, Database } from 'lucide-react';

export default function FxMonitoring() {
  const [states, setStates] = useState<CorridorState[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Signal form state
  const [signalSource, setSignalSource] = useState<SignalSource>("MANUAL");
  const [magnitude, setMagnitude] = useState("0.5");
  const [ttlSec, setTtlSec] = useState("3600");
  const [corridor, setCorridor] = useState<Pair | "ALL">("USD/INR");
  const [description, setDescription] = useState("");

  const watcher = getFxWatcher();

  const updateStates = () => {
    const newStates = watcher.getStates();
    setStates(newStates);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    updateStates();
    
    const unsubscribe = watcher.onLocalEvent((event) => {
      if (event.type === "FX_STATE_UPDATED") {
        setStates(event.states);
        setLastUpdate(new Date());
      } else if (event.type === "FX_SIGNAL_INGESTED") {
        toast.success(`Signal ingested: ${event.signal.source}`, {
          description: event.signal.description || `Corridor: ${event.signal.corridor || "ALL"}`
        });
      }
    });

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(updateStates, 5000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleIngestSignal = () => {
    const mag = parseFloat(magnitude);
    const ttl = parseInt(ttlSec);
    
    if (isNaN(mag) || mag < 0 || mag > 2) {
      toast.error("Magnitude must be between 0 and 2");
      return;
    }
    
    if (isNaN(ttl) || ttl < 60) {
      toast.error("TTL must be at least 60 seconds");
      return;
    }

    watcher.ingestSignal({
      source: signalSource,
      corridor: corridor === "ALL" ? undefined : corridor,
      magnitude: mag,
      ttlSec: ttl,
      description: description || undefined,
      timestamp: Date.now(),
    });

    setDescription("");
    updateStates();
  };

  const handleSeedPresets = () => {
    watcher.seedPresets();
    toast.success("Preset signals loaded", {
      description: "RBI, IMF, and UPI policy signals added"
    });
    updateStates();
  };

  const handleClearSignals = () => {
    watcher.clearSignals();
    toast.info("All signals cleared", {
      description: "Dynamic adjustments reset to 0"
    });
    updateStates();
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "text-success";
    if (score < 0.6) return "text-warning";
    return "text-destructive";
  };

  const getRiskLabel = (score: number) => {
    if (score < 0.3) return "LOW";
    if (score < 0.6) return "MEDIUM";
    return "HIGH";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">FX Watcher V4</h1>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                BETA TEST
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Dynamic pricing monitor for INR/PKR/GBP corridors
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh: {autoRefresh ? "ON" : "OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={updateStates}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        <Alert className="mb-6 border-warning bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            <strong>NOT CONNECTED TO PRODUCTION:</strong> This watcher is in test mode only. Quote endpoints are unchanged.
            Last update: {lastUpdate.toLocaleTimeString()}
          </AlertDescription>
        </Alert>

        {/* Corridor States */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {states.map((state) => (
            <Card key={state.pair} className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{state.pair}</span>
                  {state.inSensitiveWindow && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Clock className="h-3 w-3 mr-1" />
                      Sensitive
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Last computed: {new Date(state.lastComputedAt).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fee Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Base Fee</span>
                    <span className="font-mono font-semibold text-success">
                      {state.baseFeeBps} bps
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dynamic Adj</span>
                    <span className={`font-mono font-semibold ${state.suggestedAdjBps > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                      +{state.suggestedAdjBps} bps
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Fee</span>
                    <span className="font-mono font-bold text-lg text-primary">
                      {state.totalFeeBps} bps
                    </span>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Risk Score</span>
                    <Badge variant="outline" className={getRiskColor(state.riskScore)}>
                      {getRiskLabel(state.riskScore)}
                    </Badge>
                  </div>
                  <Progress value={state.riskScore * 100} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {(state.riskScore * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Active Signals */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-primary" />
                    Active Signals ({state.activeSignals.length})
                  </div>
                  {state.activeSignals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active signals</p>
                  ) : (
                    <div className="space-y-1">
                      {state.activeSignals.slice(0, 3).map((sig) => (
                        <div key={sig.id} className="text-xs bg-muted/50 rounded px-2 py-1">
                          <div className="font-medium">{sig.source}</div>
                          {sig.description && (
                            <div className="text-muted-foreground truncate">{sig.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signal Injection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Inject Signal
              </CardTitle>
              <CardDescription>
                Manually add market signals for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Signal Source</Label>
                <Select value={signalSource} onValueChange={(v) => setSignalSource(v as SignalSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="RBI_INTERVENTION">RBI Intervention</SelectItem>
                    <SelectItem value="IMF_PAKISTAN_PROGRAM">IMF Pakistan Program</SelectItem>
                    <SelectItem value="UPI_UK_POLICY">UPI UK Policy</SelectItem>
                    <SelectItem value="MARKET_VOL">Market Volatility</SelectItem>
                    <SelectItem value="LIQUIDITY_DRAIN">Liquidity Drain</SelectItem>
                    <SelectItem value="SPREAD_WIDENING">Spread Widening</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Corridor</Label>
                <Select value={corridor} onValueChange={(v) => setCorridor(v as Pair | "ALL")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Corridors</SelectItem>
                    <SelectItem value="USD/INR">USD/INR</SelectItem>
                    <SelectItem value="USD/PKR">USD/PKR</SelectItem>
                    <SelectItem value="GBP/INR">GBP/INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Magnitude (0-2)</Label>
                  <Input
                    type="number"
                    value={magnitude}
                    onChange={(e) => setMagnitude(e.target.value)}
                    step="0.1"
                    min="0"
                    max="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>TTL (seconds)</Label>
                  <Input
                    type="number"
                    value={ttlSec}
                    onChange={(e) => setTtlSec(e.target.value)}
                    step="60"
                    min="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Pre-market dollar sales chatter"
                />
              </div>

              <Button onClick={handleIngestSignal} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Ingest Signal
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Preset operations for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSeedPresets} variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Load Preset Signals
              </Button>
              <p className="text-xs text-muted-foreground">
                Seeds demo signals: RBI intervention (USD/INR), IMF program (USD/PKR), UPI policy (GBP/INR)
              </p>

              <Separator />

              <Button onClick={handleClearSignals} variant="destructive" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All Signals
              </Button>
              <p className="text-xs text-muted-foreground">
                Removes all active signals and resets dynamic adjustments to 0
              </p>

              <Separator />

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Safety Caps
                </h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USD/INR max adj:</span>
                    <span className="font-mono">40 bps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USD/PKR max adj:</span>
                    <span className="font-mono">60 bps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GBP/INR max adj:</span>
                    <span className="font-mono">50 bps</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-border">
                    <span>Global cap:</span>
                    <span className="font-mono text-destructive">75 bps</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
