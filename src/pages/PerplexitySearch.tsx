import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PerplexitySearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une question",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: { query }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "✅ Recherche terminée",
        description: "Résultats obtenus avec succès"
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "Comment intégrer Stripe dans une app React avec Supabase?",
    "Quels sont les meilleurs providers de paiement au Canada en 2025?",
    "Comment implémenter Interac e-Transfer dans une application web?",
    "Documentation officielle Circle USDC API",
    "Intégration MetaMask avec React TypeScript exemple de code"
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              🔍 Perplexity AI Search
            </h1>
            <p className="text-muted-foreground">
              Recherche alimentée par l'IA avec sources vérifiées
            </p>
          </div>

          {/* Quick Queries */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              RECHERCHES RAPIDES
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((q, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setQuery(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Search Input */}
          <Card className="p-6 space-y-4">
            <Textarea
              placeholder="Posez votre question ici... (ex: Comment intégrer Stripe avec React et Supabase?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-gradient-primary"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher (⌘ + Enter)
                </>
              )}
            </Button>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Answer */}
              <Card className="p-6 space-y-4">
                <h3 className="text-xl font-bold">📝 Réponse</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {result.answer}
                  </p>
                </div>
              </Card>

              {/* Citations */}
              {result.citations && result.citations.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">🔗 Sources</h3>
                  <div className="space-y-2">
                    {result.citations.map((citation: string, i: number) => (
                      <a
                        key={i}
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <span className="text-sm truncate">{citation}</span>
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Related Questions */}
              {result.relatedQuestions && result.relatedQuestions.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">💡 Questions connexes</h3>
                  <div className="space-y-2">
                    {result.relatedQuestions.map((question: string, i: number) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => setQuery(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
