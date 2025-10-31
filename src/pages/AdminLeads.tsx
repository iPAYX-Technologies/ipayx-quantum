import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string;
  country: string;
  monthly_volume: string;
  message: string;
  source: string;
  ai_score?: number;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch initial leads
  useEffect(() => {
    fetchLeads();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(lead => lead.country === countryFilter);
    }

    if (volumeFilter !== 'all') {
      filtered = filtered.filter(lead => lead.monthly_volume === volumeFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, countryFilter, volumeFilter]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('🔔 New lead received!', payload.new);
          const newLead = payload.new as Lead;
          setLeads(prevLeads => [newLead, ...prevLeads]);

          // Desktop notification
          if (Notification.permission === 'granted') {
            new Notification('Nouveau lead iPAYX! 🎉', {
              body: `${newLead.name || 'Unknown'} - ${newLead.company || 'N/A'}`,
              icon: '/ipayx-logo.png',
            });
          }

          toast.success('Nouveau lead reçu!', {
            description: `${newLead.name} de ${newLead.company}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast.error('Erreur lors du chargement des leads');
    } finally {
      setLoading(false);
    }
  };

  const resendNotification = async (lead: Lead) => {
    try {
      const { error } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          country: lead.country,
          monthlyVolume: lead.monthly_volume,
          message: lead.message,
          language: 'en',
          source: 'admin-resend',
        },
      });

      if (error) throw error;
      toast.success('Notification renvoyée!');
    } catch (error: any) {
      console.error('Error resending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const getVolumeColor = (volume: string) => {
    if (volume?.includes('10M+')) return 'bg-green-500';
    if (volume?.includes('5M-10M') || volume?.includes('1M-5M')) return 'bg-blue-500';
    if (volume?.includes('500K-1M')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const uniqueCountries = [...new Set(leads.map(l => l.country).filter(Boolean))];
  const uniqueVolumes = [...new Set(leads.map(l => l.monthly_volume).filter(Boolean))];

  const stats = {
    total: leads.length,
    today: leads.filter(l => {
      const today = new Date().toDateString();
      return new Date(l.created_at).toDateString() === today;
    }).length,
    highValue: leads.filter(l => l.monthly_volume?.includes('10M+')).length,
  };

  return (
    <>
      <Helmet>
        <title>Admin - Leads Dashboard | iPAYX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leads Administration</h1>
              <p className="text-muted-foreground">Gestion des leads en temps réel</p>
            </div>
            <Button onClick={fetchLeads} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  High Value (10M+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.highValue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {uniqueCountries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les volumes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les volumes</SelectItem>
                    {uniqueVolumes.map(volume => (
                      <SelectItem key={volume} value={volume}>{volume}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Aucun lead trouvé</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Nom</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Entreprise</th>
                        <th className="text-left p-3 font-medium">Pays</th>
                        <th className="text-left p-3 font-medium">Volume</th>
                        <th className="text-left p-3 font-medium">Source</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">
                            {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(lead.created_at).toLocaleTimeString('fr-FR')}
                            </span>
                          </td>
                          <td className="p-3">{lead.name || '-'}</td>
                          <td className="p-3 text-sm">{lead.email}</td>
                          <td className="p-3">{lead.company || '-'}</td>
                          <td className="p-3">
                            <Badge variant="outline">{lead.country || 'N/A'}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getVolumeColor(lead.monthly_volume)}>
                              {lead.monthly_volume || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{lead.source}</Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resendNotification(lead)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
