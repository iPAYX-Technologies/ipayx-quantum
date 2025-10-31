import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, Activity, Route, Download, ArrowRight, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useUserTransactions } from '@/hooks/useUserTransactions';
import TransactionChart from '@/components/TransactionChart';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { Progress } from '@/components/ui/progress';
import { sendTestEmail } from '@/utils/sendTestEmail';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, stats, loading } = useUserTransactions(user?.email);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);


  const handleTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      await sendTestEmail();
      toast.success('Email de test envoyé à ybolduc@ipayx.ai ✅');
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'From Chain', 'To Chain', 'Asset', 'Amount', 'Status', 'TX Hash'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.from_chain,
      tx.to_chain,
      tx.asset,
      tx.amount,
      tx.status,
      tx.tx_hash || 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipayx-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <DashboardSkeleton />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 mt-24">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">Monitor your cross-chain activity in real-time</p>
              {user?.email === 'demo@ipayx.com' && (
                <Badge variant="secondary" className="mt-3">
                  📊 Demo Data - Showing sample transactions
                </Badge>
              )}
            </div>
            
            {/* MetaMask & Test Email */}
            <div className="flex gap-3">
              <Button
                onClick={handleTestEmail}
                disabled={sendingTestEmail}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                📧 {sendingTestEmail ? 'Envoi...' : 'Test Email'}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats?.totalVolume.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time transfers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed routes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Route</CardTitle>
              <Route className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {stats?.topRoutes[0]?.route || 'No routes yet'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.topRoutes[0] ? `${stats.topRoutes[0].count} transfers` : 'Start trading'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Volume History Chart */}
        {stats && stats.last30Days.length > 0 && (
          <div className="mb-8">
            <TransactionChart data={stats.last30Days} />
          </div>
        )}

        {/* Top Routes Table */}
        {stats && stats.topRoutes.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Top Routes</CardTitle>
              <CardDescription>Most frequently used cross-chain paths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topRoutes.map((route, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <span className="text-muted-foreground">#{idx + 1}</span>
                        {route.route}
                      </span>
                      <span className="text-muted-foreground">
                        ${route.volume.toLocaleString()} ({route.count} tx)
                      </span>
                    </div>
                    <Progress 
                      value={(route.volume / (stats.topRoutes[0]?.volume || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <CardDescription>Your recent cross-chain transfers</CardDescription>
              </div>
              {transactions.length > 0 && (
                <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="border border-border/50 rounded-lg p-4 bg-card/30 hover:bg-card/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {tx.from_chain} <ArrowRight className="inline h-4 w-4 text-muted-foreground" /> {tx.to_chain}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Number(tx.amount).toLocaleString()} {tx.asset}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          tx.status === 'completed' ? 'default' : 
                          tx.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(tx.created_at).toLocaleString()}</span>
                      {tx.tx_hash && (
                        <span className="font-mono truncate max-w-[200px]">
                          {tx.tx_hash.substring(0, 16)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Start your first cross-chain transfer to see it here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}