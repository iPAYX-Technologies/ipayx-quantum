import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface RouteComparisonProps {
  routes: any[];
}

export function RouteComparison({ routes }: RouteComparisonProps) {
  if (routes.length === 0) return null;

  const topRoutes = routes.slice(0, 3);
  
  const chartData = topRoutes.map(route => ({
    name: route.name.length > 12 ? route.name.substring(0, 12) + '...' : route.name,
    Score: parseFloat(route.score),
    'Fee %': route.baseFeePct,
    'ETA (min)': route.latencyMin,
    Liquidity: route.liq
  }));

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 mt-6">
      <h3 className="text-lg font-semibold mb-4">Top 3 Routes Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="Score" fill="hsl(var(--primary))" />
          <Bar dataKey="Fee %" fill="hsl(var(--chart-2))" />
          <Bar dataKey="ETA (min)" fill="hsl(var(--chart-3))" />
          <Bar dataKey="Liquidity" fill="hsl(var(--chart-4))" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
