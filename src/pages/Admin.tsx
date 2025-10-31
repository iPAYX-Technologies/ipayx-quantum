import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Key, FileText, Activity, Mail, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";

export default function Admin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access admin panel",
          variant: "destructive"
        });
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
      loadData();
    } catch (error: any) {
      console.error('Admin check error:', error);
      setIsAdmin(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (accountsError) throw accountsError;
      setUserAccounts(accounts || []);

      // Load API keys
      const { data: keys, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (keysError) throw keysError;
      setApiKeys(keys || []);

      // Load transactions
      const { data: txs, error: txsError } = await supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (txsError) throw txsError;
      setTransactions(txs || []);

      // Agent logs table supprimée - plus d'agents
      setAgentLogs([]);

    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailLoading(true);
    try {
      sonnerToast.info('Envoi du test email...');
      
      const { data, error } = await supabase.functions.invoke('test-email');
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Test email response:', data);
      
      sonnerToast.success('Email test envoyé!', {
        description: `Email ID: ${data.emailId || 'N/A'}\nCheck: ybolduc@ipayx.ai`
      });
    } catch (error: any) {
      console.error('❌ Test email error:', error);
      sonnerToast.error('Erreur email test', {
        description: error.message || 'Vérifiez RESEND_API_KEY dans les secrets'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const runSecurityAudit = async () => {
    setAuditRunning(true);
    setAuditResults(null);
    
    try {
      sonnerToast.info('🔍 Lancement de l\'audit Claude Opus 4...');
      
      const { data, error } = await supabase.functions.invoke('ai-audit');
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Audit completed:', data);
      
      setAuditResults(data);
      
      const scoreColor = data.security_score >= 80 ? '🟢' : data.security_score >= 60 ? '🟡' : '🔴';
      
      sonnerToast.success(`${scoreColor} Audit terminé!`, {
        description: `Score: ${data.security_score}/100 | ${data.critical_count} critical issues`
      });
    } catch (error: any) {
      console.error('❌ Audit error:', error);
      sonnerToast.error('Erreur audit', {
        description: error.message || 'Vérifiez LOVABLE_API_KEY dans les secrets'
      });
    } finally {
      setAuditRunning(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage users, API keys, and monitor system health</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/fx-monitoring">
              <Button variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                FX Watcher
                <Badge variant="outline" className="ml-2 bg-warning/10 text-warning border-warning text-xs">BETA</Badge>
              </Button>
            </Link>
            <Button onClick={handleTestEmail} disabled={emailLoading} variant="outline">
              <Mail className={`mr-2 h-4 w-4 ${emailLoading ? 'animate-spin' : ''}`} />
              Test Email
            </Button>
            <Button onClick={loadData} disabled={loading}>
              <Activity className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="audit" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Mail className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users ({userAccounts.length})
            </TabsTrigger>
            <TabsTrigger value="keys">
              <Key className="h-4 w-4 mr-2" />
              API Keys ({apiKeys.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <FileText className="h-4 w-4 mr-2" />
              Transactions ({transactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  🤖 AI Security Audit (Claude Opus 4)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Analyse automatique de 20+ fichiers critiques (backend, frontend, RLS policies) 
                  avec Claude Opus 4 via Lovable AI.
                </p>
                
                <Button 
                  onClick={runSecurityAudit} 
                  disabled={auditRunning}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {auditRunning ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Run Claude Opus 4 Audit
                    </>
                  )}
                </Button>

                {auditResults && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">
                        {auditResults.security_score}/100
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Security Score</p>
                        <Badge variant={
                          auditResults.security_score >= 80 ? 'default' : 
                          auditResults.security_score >= 60 ? 'secondary' : 
                          'destructive'
                        }>
                          {auditResults.security_score >= 80 ? 'Excellent' : 
                           auditResults.security_score >= 60 ? 'Good' : 
                           'Needs Improvement'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-2xl font-bold">{auditResults.critical_count || 0}</p>
                            <p className="text-xs text-muted-foreground">Critical</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-2xl font-bold">{auditResults.high_count || 0}</p>
                            <p className="text-xs text-muted-foreground">High</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-2xl font-bold">{auditResults.medium_count || 0}</p>
                            <p className="text-xs text-muted-foreground">Medium</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{auditResults.low_count || 0}</p>
                            <p className="text-xs text-muted-foreground">Low</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {auditResults.executive_summary && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Executive Summary</AlertTitle>
                        <AlertDescription>{auditResults.executive_summary}</AlertDescription>
                      </Alert>
                    )}

                    {auditResults.critical_issues && auditResults.critical_issues.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-red-500">🚨 Critical Issues</h3>
                        {auditResults.critical_issues.map((issue: any, idx: number) => (
                          <Alert variant="destructive" key={idx}>
                            <XCircle className="h-4 w-4" />
                            <AlertTitle className="font-mono text-sm">
                              {issue.category} in {issue.file}:{issue.line}
                            </AlertTitle>
                            <AlertDescription className="space-y-2">
                              <p><strong>Issue:</strong> {issue.issue}</p>
                              <p><strong>Exploit:</strong> {issue.exploit}</p>
                              {issue.fix && (
                                <pre className="bg-black/10 p-2 rounded text-xs overflow-x-auto">
                                  <code>{issue.fix}</code>
                                </pre>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {auditResults.high_issues && auditResults.high_issues.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-orange-500">⚠️ High Priority Issues</h3>
                        {auditResults.high_issues.slice(0, 3).map((issue: any, idx: number) => (
                          <Alert key={idx}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-mono text-sm">
                              {issue.category} in {issue.file}:{issue.line}
                            </AlertTitle>
                            <AlertDescription>
                              <p>{issue.issue}</p>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-6 w-6" />
                  📧 HeyGen Campaign Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Priority: Sophie Martin (BNP Paribas)</h3>
                  <p className="text-sm text-muted-foreground">
                    Lead: €2M/month, Score: 85/100, Created: 9 days ago
                  </p>
                  <Button 
                    size="lg"
                    onClick={async () => {
                      sonnerToast.info('Sending campaign to Sophie Martin...');
                      try {
                        const { triggerSophieMartinCampaign } = await import('@/utils/triggerBulkCampaign');
                        const result = await triggerSophieMartinCampaign();
                        sonnerToast.success('Campaign sent to Sophie Martin!', {
                          description: `Video URL: ${result.results[0]?.video_url || 'Pending...'}`
                        });
                      } catch (error: any) {
                        sonnerToast.error('Failed to send campaign', {
                          description: error.message
                        });
                      }
                    }}
                  >
                    🎯 Send to Sophie Martin (BNP Paribas)
                  </Button>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Bulk Campaigns</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">🔥 Hot Leads (Score &gt; 70)</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send welcome campaign to all high-priority leads
                      </p>
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          sonnerToast.info('Launching bulk campaign for hot leads...');
                          try {
                            const { triggerBulkCampaign } = await import('@/utils/triggerBulkCampaign');
                            const result = await triggerBulkCampaign('welcome', 70);
                            sonnerToast.success(`Bulk campaign completed!`, {
                              description: `${result.sent}/${result.total} emails sent successfully`
                            });
                          } catch (error: any) {
                            sonnerToast.error('Bulk campaign failed', {
                              description: error.message
                            });
                          }
                        }}
                      >
                        Send to Hot Leads
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">🌟 All Active Leads (Score &gt; 50)</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send welcome campaign to all warm leads
                      </p>
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={async () => {
                          sonnerToast.info('Launching bulk campaign for all leads...');
                          try {
                            const { triggerBulkCampaign } = await import('@/utils/triggerBulkCampaign');
                            const result = await triggerBulkCampaign('welcome', 50);
                            sonnerToast.success(`Bulk campaign completed!`, {
                              description: `${result.sent}/${result.total} emails sent successfully`
                            });
                          } catch (error: any) {
                            sonnerToast.error('Bulk campaign failed', {
                              description: error.message
                            });
                          }
                        }}
                      >
                        Send to All Active
                      </Button>
                    </Card>
                  </div>
                </div>

                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Campaign Settings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Voice: en-US-JennyNeural (American English)</li>
                      <li>Avatar: Kristin_public_3_20240108</li>
                      <li>Batch size: 10 leads per batch (5s delay)</li>
                      <li>Provider: HeyGen + SendGrid</li>
                      <li>From: yan@ipayx.ai</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.email}</TableCell>
                      <TableCell>{account.company}</TableCell>
                      <TableCell>{account.country}</TableCell>
                      <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">API Keys</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>RPM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.email}</TableCell>
                      <TableCell>{key.company}</TableCell>
                      <TableCell>{key.country}</TableCell>
                      <TableCell>
                        <Badge>{key.plan}</Badge>
                      </TableCell>
                      <TableCell>{key.rpm}</TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.usage_count}</TableCell>
                      <TableCell>
                        {key.last_used_at 
                          ? new Date(key.last_used_at).toLocaleString() 
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Transaction Logs</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TX Hash</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.from_chain}</TableCell>
                      <TableCell>{tx.to_chain}</TableCell>
                      <TableCell>{tx.asset}</TableCell>
                      <TableCell>${parseFloat(tx.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          tx.status === 'completed' ? 'default' : 
                          tx.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.tx_hash ? `${tx.tx_hash.substring(0, 10)}...` : '-'}
                      </TableCell>
                      <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
