import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { importLeadsFromCSV } from "@/utils/importLeadsFromCSV";
import { ArrowLeft, Upload, Rocket, CheckCircle2, AlertCircle, Video, Mail, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CampaignLog {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_company: string;
  video_url: string | null;
  email_subject: string;
  status: string;
  sent_at: string;
  created_at: string;
}

export default function AdminBulkCampaign() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [liveStats, setLiveStats] = useState({ sent: 0, pending: 0, failed: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch existing campaigns on mount
  useEffect(() => {
    fetchRecentCampaigns();
  }, []);

  // Subscribe to realtime campaign inserts
  useEffect(() => {
    const channel = supabase
      .channel('campaign-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaigns'
        },
        async (payload) => {
          console.log('🔴 LIVE: New campaign sent!', payload);
          
          // Fetch the full campaign with lead data
          const { data: campaign } = await supabase
            .from('campaigns')
            .select(`
              id,
              email_subject,
              video_url,
              status,
              sent_at,
              created_at,
              leads:lead_id (
                name,
                email,
                company
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (campaign) {
            const newLog: CampaignLog = {
              id: campaign.id,
              lead_name: (campaign.leads as any)?.name || 'Unknown',
              lead_email: (campaign.leads as any)?.email || '',
              lead_company: (campaign.leads as any)?.company || '',
              video_url: campaign.video_url,
              email_subject: campaign.email_subject,
              status: campaign.status,
              sent_at: campaign.sent_at,
              created_at: campaign.created_at
            };

            setCampaignLogs(prev => [newLog, ...prev]);
            setLiveStats(prev => ({
              ...prev,
              sent: prev.sent + 1
            }));

            toast({
              title: "✅ Email sent!",
              description: `${newLog.lead_name} (${newLog.lead_company})`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          email_subject,
          video_url,
          status,
          sent_at,
          created_at,
          leads:lead_id (
            name,
            email,
            company
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const logs = data?.map((c: any) => ({
        id: c.id,
        lead_name: c.leads?.name || 'Unknown',
        lead_email: c.leads?.email || '',
        lead_company: c.leads?.company || '',
        video_url: c.video_url,
        email_subject: c.email_subject,
        status: c.status,
        sent_at: c.sent_at,
        created_at: c.created_at
      })) || [];

      setCampaignLogs(logs);
      
      const sent = logs.filter((l: CampaignLog) => l.status === 'sent').length;
      setLiveStats({ sent, pending: 0, failed: 0 });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };


  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    
    try {
      toast({
        title: "🚀 Launching campaign to ALL leads...",
        description: "Processing ALL imported leads (Explee pre-filtered)..."
      });

      const { data, error } = await supabase.functions.invoke('campaign-manager', {
        body: {
          batch_mode: true,
          campaign_type: 'welcome'
          // NO min_score filter - send to ALL
        }
      });

      if (error) throw error;

      setCampaignResult(data);
      
      toast({
        title: "✅ Campaign launched!",
        description: `${data.summary?.success || 0} emails sent successfully`
      });
    } catch (error: any) {
      console.error('Campaign error:', error);
      toast({
        title: "❌ Campaign failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/marketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Campaign Launch</h1>
            <p className="text-muted-foreground">Import 303 leads + launch to all HOT targets</p>
          </div>
        </div>

        {/* Launch Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Send Campaign to ALL Leads
            </CardTitle>
            <CardDescription>
              ALL imported leads (Explee pre-filtered) will receive personalized HeyGen video emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium">No filtering - Send to ALL</div>
                <div className="text-muted-foreground mt-1">
                  Since you already filtered on Explee.com, ALL leads in database will receive the campaign.<br/>
                  Go to <strong>Admin Import Leads</strong> to upload your CSV first.
                </div>
              </div>
            </div>

            {campaignResult && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-green-500">Campaign launched!</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      • Total: {campaignResult.total || 0} leads<br/>
                      • Sent: {campaignResult.sent || 0} emails<br/>
                      • Failed: {campaignResult.failed || 0} emails
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleLaunchCampaign}
              disabled={isLaunching || !!campaignResult}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              size="lg"
            >
              {isLaunching ? "Launching..." : campaignResult ? "✓ Campaign sent" : "🚀 Send Campaign to ALL Leads"}
            </Button>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-500">⚠️ Important</div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Bulk campaigns process ALL leads (no min_score filter)</li>
                    <li>HeyGen API rate limits apply (~10 videos/batch)</li>
                    <li>SendGrid has sending limits (check your plan)</li>
                    <li>Expected time: ~45 min for 300 leads (10 leads/batch, 5 sec delay)</li>
                    <li>Monitor the logs below for real-time status</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Monitoring */}
        {(isLaunching || campaignResult || campaignLogs.length > 0) && (
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <Mail className="h-5 w-5" />
                  {isLaunching && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  )}
                </div>
                Live Campaign Monitor
                {isLaunching && <Badge className="bg-green-500">LIVE</Badge>}
              </CardTitle>
              <CardDescription>
                Real-time email delivery tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Sent</div>
                  <div className="text-2xl font-bold text-green-500">{liveStats.sent}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold text-yellow-500">{liveStats.pending}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Failed</div>
                  <div className="text-2xl font-bold text-red-500">{liveStats.failed}</div>
                </div>
              </div>

              {/* Recent Campaigns Table */}
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Waiting for campaigns to start...
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaignLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.lead_name}</div>
                                <div className="text-xs text-muted-foreground">{log.lead_email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{log.lead_company || '-'}</TableCell>
                            <TableCell>
                              {log.video_url ? (
                                <a 
                                  href={log.video_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-green-500 hover:underline"
                                >
                                  <Video className="h-4 w-4" />
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <Badge variant="outline" className="text-yellow-500">
                                  Generating...
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  log.status === 'sent' 
                                    ? 'bg-green-500' 
                                    : log.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                                }
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
