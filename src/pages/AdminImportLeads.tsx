import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { importLeadsFromCSV } from "@/utils/importLeadsFromCSV";

export default function AdminImportLeads() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    inserted: number;
    hot: number;
    warm: number;
    cold: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setStats(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const csvText = await file.text();
      const result = await importLeadsFromCSV(csvText);
      
      setStats(result);
      toast({
        title: "✅ Import successful!",
        description: `${result.inserted} leads imported (ALL scored 100)`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Import Leads (Explee CSV)</h1>
          <p className="text-muted-foreground">Upload your Explee export - ALL leads will be scored 100 (no internal filtering)</p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Supported format: export_10061.csv from Explee.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {file ? (
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Click to select CSV file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Or drag and drop here
                    </p>
                  </div>
                )}
              </label>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>No internal filtering:</strong> Since you already filtered on Explee.com, 
                ALL valid emails will be imported with score 100 (HOT) and ready to send.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
              size="lg"
            >
              {importing ? "Importing..." : `Import ALL Leads (Score 100)`}
            </Button>

            {importing && (
              <div className="space-y-2">
                <Progress value={50} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processing CSV...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        {stats && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Import Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Detected</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.inserted}</div>
                  <div className="text-sm text-muted-foreground">Valid Emails</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-red-500">{stats.hot}</div>
                  <div className="text-sm text-muted-foreground">HOT (Score 100)</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {stats.total - stats.inserted}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
              </div>

              <Alert className="mt-4 bg-blue-500/10 border-blue-500/50">
                <AlertDescription>
                  ✅ All {stats.inserted} leads are now ready to receive campaigns. 
                  Go to <strong>Admin Bulk Campaign</strong> to send emails to ALL leads.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
