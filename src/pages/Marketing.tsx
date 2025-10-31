import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Eye, MousePointer, MessageSquare, DollarSign, TrendingUp, Send, Play, Pause, Video, ExternalLink, Rocket, Zap, Plus } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trigger40HotLeadsCampaign } from "@/utils/triggerBulkCampaign";

interface Lead {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  country: string | null;
  monthly_volume: string | null;
  ai_score: number | null;
  last_campaign_sent_at: string | null;
  campaigns_count: number | null;
  last_opened_at: string | null;
  last_clicked_at: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  lead_id: string;
  campaign_type: string;
  video_url: string | null;
  email_subject: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  status: string;
  leads: Lead | null;
}

interface Metrics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

export default function Marketing() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({ current: 0, total: 0 });
  const [minScore, setMinScore] = useState(70);
  const [campaignType, setCampaignType] = useState<string>('welcome');
  const [videoPreview, setVideoPreview] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    total_replied: 0,
    total_bounced: 0,
    total_unsubscribed: 0,
    open_rate: 0,
    click_rate: 0,
    reply_rate: 0,
    bounce_rate: 0,
    unsubscribe_rate: 0
  });

  useEffect(() => {
    fetchLeads();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    calculateMetrics();
  }, [campaigns]);

  // Auto-refresh stats every 5 seconds during campaign sending
  useEffect(() => {
    if (!isCampaignRunning) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing stats during campaign...');
      fetchLeads();
      fetchCampaigns();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isCampaignRunning]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('ai_score', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch leads: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, leads(*)')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const calculateMetrics = () => {
    const total = campaigns.length;
    if (total === 0) return;

    const opened = campaigns.filter(c => c.opened_at).length;
    const clicked = campaigns.filter(c => c.clicked_at).length;
    const replied = campaigns.filter(c => c.replied_at).length;
    const bounced = campaigns.filter(c => c.bounced_at).length;
    const unsubscribed = campaigns.filter(c => c.unsubscribed_at).length;

    setMetrics({
      total_sent: total,
      total_opened: opened,
      total_clicked: clicked,
      total_replied: replied,
      total_bounced: bounced,
      total_unsubscribed: unsubscribed,
      open_rate: total > 0 ? Math.round((opened / total) * 100) : 0,
      click_rate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      reply_rate: total > 0 ? Math.round((replied / total) * 100) : 0,
      bounce_rate: total > 0 ? Math.round((bounced / total) * 100) : 0,
      unsubscribe_rate: total > 0 ? Math.round((unsubscribed / total) * 100) : 0,
    });
  };

  const launchCampaign = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }

    setIsCampaignRunning(true);
    setCampaignProgress({ current: 0, total: selectedLeads.length });

    try {
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: {
          lead_ids: selectedLeads,
          campaign_type: campaignType
        }
      });

      if (error) throw error;

      toast.success(`Campaign launched! ${data.sent}/${data.total} emails sent`);
      
      // Refresh data
      await fetchLeads();
      await fetchCampaigns();
      
      setSelectedLeads([]);
    } catch (error: any) {
      toast.error(`Campaign failed: ${error.message}`);
    } finally {
      setIsCampaignRunning(false);
      setCampaignProgress({ current: 0, total: 0 });
    }
  };

  const testHeyGen = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-heygen');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`✅ HeyGen Test Réussi! Video ID: ${data.video_id || 'N/A'}`);
        console.log("HeyGen test result:", data);
      } else {
        toast.error(`❌ HeyGen Test Failed: ${data.error}`);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const launchBulkHeyGenCampaign = async (minScore: number, maxLeads?: number) => {
    setIsCampaignRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: {
          batch_mode: true,
          min_score: minScore,
          max_leads: maxLeads,
          campaign_type: 'welcome'
        }
      });

      if (error) throw error;

      toast.success(`🚀 Bulk HeyGen campaign launched! Processing ${data?.leads_count || 'all'} leads...`);
      await fetchCampaigns();
      await fetchLeads();
    } catch (error: any) {
      console.error('Bulk campaign error:', error);
      toast.error(`Failed to launch bulk campaign: ${error.message}`);
    } finally {
      setIsCampaignRunning(false);
    }
  };

  const launch303Campaign = async () => {
    setIsCampaignRunning(true);
    toast.loading('📥 Sending emails to 211 leads...');
    
    try {
      // Call campaign-manager in batch mode (will process ALL unsent leads)
      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: {
          batch_mode: true,
          campaign_type: 'welcome'
        }
      });

      if (error) throw error;

      toast.success(`🎉 SUCCESS! ${data.sent}/${data.total} emails sent!`);
      
      await fetchCampaigns();
      await fetchLeads();
      
    } catch (error: any) {
      console.error('❌ Campaign error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCampaignRunning(false);
    }
  };

  const launch40HotLeads = async () => {
    setIsCampaignRunning(true);
    toast.loading('🚀 Launching campaign for 40 HOT leads (score 100)...');
    
    try {
      const result = await trigger40HotLeadsCampaign();
      
      if (result.success === false) {
        toast.warning(result.message || 'No eligible leads found');
        return;
      }

      toast.success(`✅ Campaign launched! Processing ${result.summary?.total || 40} HOT leads. Videos will be generated in 20-30 minutes.`);
      console.log('📊 Campaign result:', result);
      
      // Refresh data
      await fetchCampaigns();
      await fetchLeads();
      
    } catch (error: any) {
      console.error('❌ 40 HOT leads campaign error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCampaignRunning(false);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const filteredLeads = leads.filter(lead => {
    if (lead.ai_score === null) return true;
    return lead.ai_score >= minScore;
  });

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="outline">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-green-500">{ score}</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">{score}</Badge>;
    return <Badge className="bg-red-500">{score}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      sent: 'outline',
      opened: 'default',
      clicked: 'default',
      replied: 'default',
      bounced: 'destructive',
      unsubscribed: 'destructive',
      converted: 'default'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  // Generate 30-day timeline data
  const generateTimelineData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayCampaigns = campaigns.filter(c => c.sent_at?.startsWith(date));
      const opened = dayCampaigns.filter(c => c.opened_at).length;
      const clicked = dayCampaigns.filter(c => c.clicked_at).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: dayCampaigns.length,
        opened,
        clicked
      };
    });
  };

  return (
    <>
      <Helmet>
        <title>Marketing Automation | iPAYX Protocol</title>
        <meta name="description" content="Email marketing automation dashboard with HeyGen videos and SendGrid tracking" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 px-6 pb-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Marketing Automation</h1>
              <p className="text-muted-foreground mt-1">Email campaigns with AI-generated videos</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={testHeyGen}
                disabled={isLoading}
                variant="default"
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                🎬 Test HeyGen
              </Button>
              <Button
                onClick={launch40HotLeads}
                disabled={isCampaignRunning}
                variant="default"
                className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                {isCampaignRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                🔥 Launch 40 HOT Leads
              </Button>
              <Button
                onClick={() => window.location.href = '/admin/lead-acquisition'}
                variant="default"
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4" />
                Acquire Leads
              </Button>
              <Button
                onClick={launch303Campaign}
                disabled={isCampaignRunning}
                variant="default"
                className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg px-6 py-6 h-auto font-bold"
              >
                {isCampaignRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
                🚀 ENVOYER 211 EMAILS MAINTENANT
              </Button>
              <Button
                onClick={() => launchBulkHeyGenCampaign(70, 100)}
                disabled={isCampaignRunning}
                variant="outline"
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                100 Hot
              </Button>
              <Button
                onClick={() => launchBulkHeyGenCampaign(50, 1000)}
                disabled={isCampaignRunning}
                variant="outline"
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                1K Warm+
              </Button>
              <Button
                onClick={() => launchBulkHeyGenCampaign(30)}
                disabled={isCampaignRunning}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Rocket className="h-4 w-4" />
                🚀 FULL POWER
              </Button>
              <Button variant="ghost" onClick={() => window.open('https://app.sendgrid.com', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                SendGrid
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total_sent}</p>
                </div>
                <Mail className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-3xl font-bold mt-2">{metrics.open_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.total_opened} opened</p>
                </div>
                <Eye className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                  <p className="text-3xl font-bold mt-2">{metrics.click_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.total_clicked} clicked</p>
                </div>
                <MousePointer className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reply Rate</p>
                  <p className="text-3xl font-bold mt-2">{metrics.reply_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.total_replied} replied</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-destructive/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                  <p className="text-3xl font-bold mt-2 text-destructive">{metrics.bounce_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.total_bounced} bounced</p>
                </div>
                <TrendingUp className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-destructive/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unsubscribe</p>
                  <p className="text-3xl font-bold mt-2 text-destructive">{metrics.unsubscribe_rate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{metrics.total_unsubscribed} unsub</p>
                </div>
                <DollarSign className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </Card>
          </div>

          {/* Timeline Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Activity (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={generateTimelineData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3} 
                />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--foreground))" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Line type="monotone" dataKey="sent" stroke="#8b5cf6" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="opened" stroke="#10b981" strokeWidth={2} name="Opened" />
                <Line type="monotone" dataKey="clicked" stroke="#f59e0b" strokeWidth={2} name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="leads" className="space-y-4">
            <TabsList>
              <TabsTrigger value="leads">Qualified Leads ({filteredLeads.length})</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
            </TabsList>

            {/* Leads Tab */}
            <TabsContent value="leads" className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium">Min AI Score: {minScore}</label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="w-40 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Campaign Type</label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger className="w-[180px] mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="followup_1">Follow-up 1</SelectItem>
                          <SelectItem value="followup_2">Follow-up 2</SelectItem>
                          <SelectItem value="demo">Demo Invitation</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={launchCampaign} 
                    disabled={selectedLeads.length === 0 || isCampaignRunning}
                    size="lg"
                  >
                    {isCampaignRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending {campaignProgress.current}/{campaignProgress.total}...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Launch Campaign ({selectedLeads.length})
                      </>
                    )}
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedLeads.length === filteredLeads.length}
                            onCheckedChange={(checked) => {
                              setSelectedLeads(checked ? filteredLeads.map(l => l.id) : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Monthly Volume</TableHead>
                        <TableHead>AI Score</TableHead>
                        <TableHead>Campaigns</TableHead>
                        <TableHead>Last Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No leads found. Adjust the minimum score filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedLeads.includes(lead.id)}
                                onCheckedChange={() => toggleLeadSelection(lead.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{lead.name}</p>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{lead.company}</p>
                              <p className="text-xs text-muted-foreground">{lead.country}</p>
                            </TableCell>
                            <TableCell>{lead.monthly_volume || 'N/A'}</TableCell>
                            <TableCell>{getScoreBadge(lead.ai_score)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{lead.campaigns_count || 0} sent</Badge>
                            </TableCell>
                            <TableCell>
                              {lead.last_campaign_sent_at 
                                ? new Date(lead.last_campaign_sent_at).toLocaleDateString()
                                : 'Never'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <Card className="p-6">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Clicked</TableHead>
                        <TableHead>Bounced</TableHead>
                        <TableHead>Unsubscribed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Video</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{campaign.leads?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{campaign.leads?.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{campaign.campaign_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(campaign.sent_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {campaign.opened_at ? (
                              <span className="text-green-600">✓ {new Date(campaign.opened_at).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {campaign.clicked_at ? (
                              <span className="text-green-600">✓ {new Date(campaign.clicked_at).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {campaign.bounced_at ? (
                              <span className="text-red-600">✗ {new Date(campaign.bounced_at).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {campaign.unsubscribed_at ? (
                              <span className="text-red-600">✗ {new Date(campaign.unsubscribed_at).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                          <TableCell>
                            {campaign.video_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVideoPreview(campaign)}
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">Generating...</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!videoPreview} onOpenChange={() => setVideoPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Campaign Video - {videoPreview?.leads?.name}</DialogTitle>
          </DialogHeader>
          {videoPreview?.video_url && (
            <video controls className="w-full rounded-lg">
              <source src={videoPreview.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}