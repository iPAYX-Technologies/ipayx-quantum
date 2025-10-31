import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, TrendingUp, Zap, Globe } from "lucide-react";

export default function Pitch() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const navigate = useNavigate();
  
  const handleUnlock = () => {
    if (password === "ipayx2025") {
      setUnlocked(true);
    }
  };
  
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Card className="p-8 max-w-md w-full mx-4 bg-card border-border">
          <CardContent className="space-y-6 p-0">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">🔒 Pitch Deck Access</h1>
            <p className="text-sm text-muted-foreground text-center">
              This presentation is password-protected for confidentiality
            </p>
            <Input 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              className="text-center"
            />
            <Button onClick={handleUnlock} className="w-full" size="lg">
              Unlock Presentation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            iPAYX Protocol
          </h1>
          <p className="text-xl text-muted-foreground">Cross-Chain Payment Infrastructure</p>
        </div>

        {/* Slide 1: Real Traction */}
        <section className="border-b border-border pb-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-400" />
            Live Traction
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-cyan-950/30 to-background border-cyan-500/30">
              <div className="text-5xl font-bold text-cyan-400 mb-2">49</div>
              <div className="text-muted-foreground">Payments Processed</div>
              <div className="text-xs text-muted-foreground mt-2">Real companies, real volume</div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-green-950/30 to-background border-green-500/30">
              <div className="text-5xl font-bold text-green-400 mb-2">$3.66M</div>
              <div className="text-muted-foreground">Transaction Volume</div>
              <div className="text-xs text-muted-foreground mt-2">Verified blockchain txs</div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-purple-950/30 to-background border-purple-500/30">
              <div className="text-5xl font-bold text-purple-400 mb-2">148</div>
              <div className="text-muted-foreground">Rails Compared</div>
              <div className="text-xs text-muted-foreground mt-2">Real-time optimization</div>
            </Card>
          </div>
        </section>

        {/* Slide 2: Live Demo */}
        <section className="border-b border-border pb-12">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Interactive Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 hover:border-primary/50 transition-all cursor-pointer group" onClick={() => navigate('/quote')}>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Compare Routes</h3>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </div>
                <p className="text-muted-foreground">
                  See 148 payment routes compared in real-time with live pricing and settlement times
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>3 best routes displayed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Real FX rates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Settlement time vs cost analysis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="p-8 hover:border-primary/50 transition-all cursor-pointer group" onClick={() => navigate('/demo')}>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Process Payment</h3>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </div>
                <p className="text-muted-foreground">
                  Execute a live test payment through Coinbase Commerce or MetaMask
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Coinbase integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>MetaMask wallet support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Real blockchain settlement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Slide 3: V2 Roadmap */}
        <section>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-400" />
            V2 Roadmap (Q1 2025)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-950/20 to-background border-green-500/20">
              <h3 className="text-xl font-semibold mb-4 text-green-400">✅ In Progress</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">●</span>
                  <div>
                    <div className="font-medium">Email Infrastructure</div>
                    <div className="text-sm text-muted-foreground">SPF/DKIM/DMARC configuration</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">●</span>
                  <div>
                    <div className="font-medium">Public API Beta</div>
                    <div className="text-sm text-muted-foreground">REST API for route comparison</div>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-cyan-950/20 to-background border-cyan-500/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">📦 Coming Soon</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">●</span>
                  <div>
                    <div className="font-medium">White-Label Widget</div>
                    <div className="text-sm text-muted-foreground">Embeddable payment selector</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 mt-1">●</span>
                  <div>
                    <div className="font-medium">Enterprise Dashboard</div>
                    <div className="text-sm text-muted-foreground">Real-time analytics & reporting</div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 pt-8">
          <Card className="p-8 bg-gradient-to-br from-purple-950/30 to-background border-purple-500/30">
            <h2 className="text-3xl font-bold mb-4">Ready to See It In Action?</h2>
            <p className="text-muted-foreground mb-6">
              Test our live platform with real blockchain transactions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/demo')} className="text-lg">
                Launch Live Demo
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/quote')} className="text-lg">
                Get Quote
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
