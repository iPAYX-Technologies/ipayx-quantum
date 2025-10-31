import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, Clock, DollarSign, Shield, TrendingDown, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface Route {
  provider: string;
  from_chain: string;
  to_chain: string;
  fee_usd: number;
  eta_minutes: number;
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  features: string[];
}

const CHAINS = [
  { value: 'network-evm-1', label: 'Network A', icon: '⟠' },
  { value: 'network-evm-2', label: 'Network B', icon: '⬢' },
  { value: 'network-evm-3', label: 'Network C', icon: '◆' },
  { value: 'network-evm-4', label: 'Network D', icon: '🔴' },
  { value: 'network-evm-5', label: 'Network E', icon: '🔵' },
  { value: 'network-f', label: 'Network F', icon: '✦' },
  { value: 'network-g', label: 'Network G', icon: '◎' },
  { value: 'network-h', label: 'Network H', icon: 'ℏ' },
  { value: 'network-i', label: 'Network I', icon: '◇' },
  { value: 'network-j', label: 'Network J', icon: '⚡' },
];

const ASSETS = ['USDC', 'USDT', 'EURC', 'PYUSD'];

export default function MetaRouter() {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState({
    from_chain: '',
    to_chain: '',
    asset: 'USDC',
    amount: '',
  });

  const searchRoutes = async () => {
    if (!formData.from_chain || !formData.to_chain || !formData.amount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-router', {
        body: {
          fromNetwork: formData.from_chain,
          toNetwork: formData.to_chain,
          asset: formData.asset,
          amount: parseFloat(formData.amount),
        },
      });

      if (error) throw error;

      setRoutes(data.routes || []);
      toast.success(`${data.routes?.length || 0} routes trouvées`);
    } catch (error: any) {
      console.error('Error searching routes:', error);
      toast.error('Erreur lors de la recherche de routes');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const configs = {
      low: { variant: 'default' as const, label: 'Faible risque' },
      medium: { variant: 'secondary' as const, label: 'Risque moyen' },
      high: { variant: 'destructive' as const, label: 'Risque élevé' },
    };
    const config = configs[risk as keyof typeof configs] || configs.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Demo Mode Banner */}
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-4xl mx-auto">
          <p className="text-yellow-200 text-sm flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <strong>Demo Mode:</strong> Transactions are simulated for demonstration purposes. No real blockchain transfers are executed.
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Meta Router iPayX
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trouvez la route optimale pour vos paiements cross-chain
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">Instant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <span className="text-sm">Économique</span>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card className="max-w-4xl mx-auto mb-12 shadow-2xl border-primary/20 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl">Rechercher une route</CardTitle>
            <CardDescription>
              Comparez les meilleures options pour votre transfert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="from">Depuis</Label>
                <Select
                  value={formData.from_chain}
                  onValueChange={(value) => setFormData({ ...formData, from_chain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAINS.map((chain) => (
                      <SelectItem key={chain.value} value={chain.value}>
                        <span className="flex items-center gap-2">
                          <span>{chain.icon}</span>
                          <span>{chain.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="to">Vers</Label>
                <Select
                  value={formData.to_chain}
                  onValueChange={(value) => setFormData({ ...formData, to_chain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAINS.map((chain) => (
                      <SelectItem key={chain.value} value={chain.value}>
                        <span className="flex items-center gap-2">
                          <span>{chain.icon}</span>
                          <span>{chain.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="asset">Asset</Label>
                <Select
                  value={formData.asset}
                  onValueChange={(value) => setFormData({ ...formData, asset: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSETS.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={searchRoutes}
              disabled={loading}
              className="w-full mt-6 h-12 text-lg hover-scale"
            >
              {loading ? 'Recherche en cours...' : 'Rechercher les meilleures routes'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Routes Results */}
        {routes.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-6">
              {routes.length} route{routes.length > 1 ? 's' : ''} disponible{routes.length > 1 ? 's' : ''}
            </h2>

            {routes.map((route, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {CHAINS.find(c => c.value === route.from_chain)?.icon}
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      <div className="text-4xl">
                        {CHAINS.find(c => c.value === route.to_chain)?.icon}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-lg">{route.provider}</h3>
                        <p className="text-sm text-muted-foreground">
                          {CHAINS.find(c => c.value === route.from_chain)?.label} → {CHAINS.find(c => c.value === route.to_chain)?.label}
                        </p>
                      </div>
                    </div>

                    {index === 0 && (
                      <Badge variant="default" className="text-sm px-3 py-1">
                        ⭐ Meilleur choix
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Frais</p>
                        <p className="font-bold">${route.fee_usd.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Durée</p>
                        <p className="font-bold">{route.eta_minutes} min</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Risque</p>
                        <div>{getRiskBadge(route.risk_level)}</div>
                      </div>
                    </div>
                  </div>

                  {route.features && route.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {route.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button className="w-full hover-scale">
                    Sélectionner cette route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {routes.length === 0 && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">🛣️</div>
            <p className="text-xl text-muted-foreground">
              Recherchez une route pour commencer
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}