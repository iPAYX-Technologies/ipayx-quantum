import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Keys() {
  const { t } = useLanguage();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.functions.invoke('sandbox-key', {
        body: { company, email, country }
      });

      if (error) throw error;

      setGeneratedKey(data.key);
      toast.success(t.keys.success, {
        description: "Copy your key and keep it safe"
      });
    } catch (error) {
      toast.error('Failed to generate key', {
        description: 'Please try again'
      });
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">{t.keys.title}</h1>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company">{t.keys.form.company}</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.keys.form.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t.keys.form.country}</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary border-0 shadow-glow-violet hover:shadow-glow-blue"
            >
              {t.keys.form.submit}
            </Button>
          </form>

          {generatedKey && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Your Sandbox Key:</p>
              <code className="text-sm font-mono text-primary break-all">{generatedKey}</code>
              <p className="text-xs text-muted-foreground mt-3">
                Rate limit: 30 requests/minute · Plan: Demo
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}