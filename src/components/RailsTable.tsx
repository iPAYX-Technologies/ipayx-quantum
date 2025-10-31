import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { scoreRail, SCORING_PRESETS, ScoringWeights } from "@/lib/scoring";

type Rail = {
  name: string;
  type: string;
  feePct: number;
  etaMin: number;
  quoteFX: number;
  oracleFX: number;
  liq: number;
  vol: number;
  status: 'live' | 'down';
  provider?: string;
};

type SortKey = 'score' | 'feePct' | 'etaMin' | 'liq' | 'vol';

export default function RailsTable({ weights = SCORING_PRESETS.balanced }: { weights?: ScoringWeights }) {
  const [rails, setRails] = useState<Rail[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDesc, setSortDesc] = useState(true);

  const fetchRails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('proxy-github', {
        body: { endpoint: '/meta-router' }
      });

      if (error) throw error;

      if (data?.content) {
        const parsed = JSON.parse(data.content);
        const railsData = parsed.rails || [];
        setRails(railsData);
      }
    } catch (err) {
      console.error('Failed to fetch rails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRails();
  }, []);

  const sortedRails = [...rails]
    .map(r => ({
      ...r,
      score: scoreRail(r, weights)
    }))
    .sort((a, b) => {
      let valA = sortKey === 'score' ? a.score : a[sortKey];
      let valB = sortKey === 'score' ? b.score : b[sortKey];
      return sortDesc ? valB - valA : valA - valB;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Meta-Router Rails</h3>
        <Button onClick={fetchRails} disabled={loading} size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rail</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort('feePct')}>
                  Fee %
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort('etaMin')}>
                  Latency (min)
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort('liq')}>
                  Liquidity
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort('vol')}>
                  Volatility
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => toggleSort('score')}>
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRails.map((rail, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{rail.name}</TableCell>
                <TableCell>{rail.type}</TableCell>
                <TableCell className="text-right">{(rail.feePct * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-right">{rail.etaMin.toFixed(1)}</TableCell>
                <TableCell className="text-right">{rail.liq.toFixed(2)}</TableCell>
                <TableCell className="text-right">{rail.vol.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">{rail.score.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={rail.status === 'live' ? 'default' : 'destructive'}>
                    {rail.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{rail.provider || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rails.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-8">No rails available</p>
      )}
    </Card>
  );
}
