import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  from_chain: string;
  to_chain: string;
  asset: string;
  amount: number;
  status: string;
  created_at: string;
  tx_hash?: string;
  partner_response?: any;
}

interface TransactionStats {
  totalVolume: number;
  totalTransactions: number;
  topRoutes: Array<{ route: string; count: number; volume: number }>;
  last30Days: Array<{ date: string; volume: number; count: number }>;
}

export function useUserTransactions(userEmail: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const { data: userAccount } = await supabase
          .from('user_accounts')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (!userAccount) {
          setTransactions([]);
          setStats({
            totalVolume: 0,
            totalTransactions: 0,
            topRoutes: [],
            last30Days: Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (29 - i));
              return {
                date: date.toISOString().split('T')[0],
                volume: 0,
                count: 0
              };
            })
          });
          setLoading(false);
          return;
        }

        const { data: txData, error } = await supabase
          .from('transaction_logs')
          .select('*')
          .eq('user_account_id', userAccount.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const txs = txData || [];
        setTransactions(txs);

        const totalVolume = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const totalTransactions = txs.length;

        const routeMap = new Map<string, { count: number; volume: number }>();
        txs.forEach(tx => {
          const route = `${tx.from_chain} → ${tx.to_chain}`;
          const existing = routeMap.get(route) || { count: 0, volume: 0 };
          routeMap.set(route, {
            count: existing.count + 1,
            volume: existing.volume + Number(tx.amount)
          });
        });

        const topRoutes = Array.from(routeMap.entries())
          .map(([route, data]) => ({ route, ...data }))
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 5);

        const last30Days: Array<{ date: string; volume: number; count: number }> = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayTxs = txs.filter(tx => 
            tx.created_at.startsWith(dateStr)
          );

          last30Days.push({
            date: dateStr,
            volume: dayTxs.reduce((sum, tx) => sum + Number(tx.amount), 0),
            count: dayTxs.length
          });
        }

        setStats({
          totalVolume,
          totalTransactions,
          topRoutes,
          last30Days
        });

      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
        setStats({
          totalVolume: 0,
          totalTransactions: 0,
          topRoutes: [],
          last30Days: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              volume: 0,
              count: 0
            };
          })
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userEmail]);

  return { transactions, stats, loading };
}
