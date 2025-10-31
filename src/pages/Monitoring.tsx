import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Clock, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  totalVolume: number;
  avgLatency: number;
  successRate: number;
  activeProviders: number;
  transactions24h: number;
}

const mockVolumeData = [
  { time: '00:00', volume: 500000 },
  { time: '04:00', volume: 750000 },
  { time: '08:00', volume: 1200000 },
  { time: '12:00', volume: 1800000 },
  { time: '16:00', volume: 1500000 },
  { time: '20:00', volume: 900000 },
];

const mockLatencyData = [
  { provider: 'Stellar', avg: 12, max: 18 },
  { provider: 'Tron', avg: 8, max: 15 },
  { provider: 'CCIP', avg: 45, max: 90 },
  { provider: 'XRPL', avg: 5, max: 10 },
];

export default function Monitoring() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalVolume: 0,
    avgLatency: 0,
    successRate: 0,
    activeProviders: 0,
    transactions24h: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch total volume and transaction count
        const { data: txData, error: txError } = await supabase
          .from('transaction_logs')
          .select('amount, created_at, status');

        if (txError) throw txError;

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const last24h = txData?.filter(tx => new Date(tx.created_at) >= yesterday) || [];
        const totalVolume = last24h.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const successCount = last24h.filter(tx => tx.status === 'settled').length;
        const successRate = last24h.length > 0 ? (successCount / last24h.length) * 100 : 0;

        // Fetch system metrics for latency
        const { data: metricsData } = await supabase
          .from('system_metrics')
          .select('value, metric_type')
          .eq('metric_type', 'avg_latency')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setMetrics({
          totalVolume,
          avgLatency: metricsData?.value ? Number(metricsData.value) : 45,
          successRate: parseFloat(successRate.toFixed(1)),
          activeProviders: 8,
          transactions24h: last24h.length
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-32">
        <h1 className="text-4xl font-bold mb-8">Real-Time Monitoring</h1>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `$${(metrics.totalVolume / 1000000).toFixed(1)}M`}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-500" /> Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${metrics.avgLatency}s`}
              </div>
              <p className="text-xs text-muted-foreground">Across all providers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${metrics.successRate}%`}
              </div>
              <Badge variant="outline" className="mt-2 bg-green-500/10 text-green-600">
                {metrics.successRate >= 99 ? 'Excellent' : 'Good'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : metrics.activeProviders}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? '...' : `${metrics.transactions24h} tx today`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Volume Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction Volume (24h)</CardTitle>
            <CardDescription>Real-time cross-border payment volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="volume" stroke="#33B5E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Latency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Latency Comparison</CardTitle>
            <CardDescription>Average vs Maximum latency (seconds)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockLatencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" fill="#33B5E5" name="Avg Latency" />
                <Bar dataKey="max" fill="#8884d8" name="Max Latency" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
