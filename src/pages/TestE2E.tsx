import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function TestE2E() {
  const [amount, setAmount] = useState("50000");
  const [paymentAmount, setPaymentAmount] = useState("350");
  const [toAddress, setToAddress] = useState("0xA4FAac...");
  const [isRunning, setIsRunning] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runE2ETest = async () => {
    setIsRunning(true);
    setLogs([]);
    setRoutes([]);
    setPaymentResult(null);

    try {
      // Step 1: Get routes from meta-router
      addLog("📡 Calling meta-router for $50k USDT...");
      const { data: routerData, error: routerError } = await supabase.functions.invoke('meta-router', {
        body: {
          fromNetwork: 'ETHEREUM',
          toNetwork: 'TRON',
          asset: 'USDT',
          amount: amount
        }
      });

      if (routerError) throw routerError;

      addLog(`✅ Found ${routerData.routes.length} routes`);
      setRoutes(routerData.routes);

      const bestRoute = routerData.routes[0];
      addLog(`🏆 Best route: ${bestRoute.provider} (${bestRoute.totalFee}% fee, ${bestRoute.etaSec}s ETA)`);

      // Step 2: Simulate payment execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`💳 Executing payment of $${paymentAmount} USDT to ${toAddress}...`);

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('payment-simulator', {
        body: {
          provider: bestRoute.provider,
          amount: paymentAmount,
          asset: 'USDT',
          toAddress
        }
      });

      if (paymentError) throw paymentError;

      setPaymentResult(paymentData);
      paymentData.logs.forEach((log: string) => addLog(log));

      toast.success("Test E2E completed!", {
        description: paymentData.message
      });
    } catch (error) {
      console.error('E2E test error:', error);
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Test failed", {
        description: "Check logs for details"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">End-to-End Payment Test</h1>
        <p className="text-muted-foreground mb-8">Simulate $50k routing + $350 USDT payment to wallet</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 space-y-6 h-fit">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Routing Amount (for route selection)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Amount (actual payment)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="350"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0xA4FAac..."
                />
              </div>
            </div>

            <Button
              onClick={runE2ETest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run E2E Test
            </Button>

            {/* Payment Result Summary */}
            {paymentResult && (
              <Card className="bg-primary/5 border-primary/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {paymentResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">{paymentResult.message}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>TxID: {paymentResult.txid?.slice(0, 20)}...</div>
                  <div>Provider: {paymentResult.details?.provider}</div>
                  <div>Gas: {paymentResult.details?.gasUsed} USDT</div>
                </div>
              </Card>
            )}
          </Card>

          {/* Results & Logs */}
          <div className="space-y-6">
            {/* Routes */}
            {routes.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
                <h3 className="font-semibold mb-4">Available Routes</h3>
                <div className="space-y-2">
                  {routes.map((route, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${idx === 0 ? 'bg-primary/10 border-primary/30' : 'bg-card/30 border-border/30'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{route.provider}</span>
                        <span className="text-sm text-primary">{route.totalFee}% fee</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {route.etaSec}s ETA • Score: {route.score?.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Logs */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
              <h3 className="font-semibold mb-4">Execution Logs</h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs yet. Run test to see execution details.</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="text-green-400">{log}</div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
