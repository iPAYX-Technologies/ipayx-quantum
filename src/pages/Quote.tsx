// Force cache clear - 2025-10-29 13:35
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RouteCard } from "@/components/RouteCard";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { getAllCountries } from "@/lib/countries";
import { toast } from "@/hooks/use-toast";
import { findOptimalRoute } from "@/services/meta-router-v4";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Mail, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";


export default function Quote() {
  const { language, t } = useLanguage();
  const countries = getAllCountries();
  
  const [fromCountry, setFromCountry] = useState<string>("");
  const [toCountry, setToCountry] = useState<string>("");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [amount, setAmount] = useState<string>("1000000");
  const [loading, setLoading] = useState<boolean>(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string>("client@example.com");

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const formatAmount = (num: number) => {
    return language === 'fr' 
      ? num.toLocaleString('fr-FR').replace(/\s/g, '\u00A0') 
      : num.toLocaleString('en-US');
  };

  const handleGetQuote = async () => {
    if (!fromCountry || !toCountry || !amount) {
      toast({
        title: t.quote.missingInfo,
        description: t.quote.fillAllFields,
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    
    if (amountNum < 5000) {
      toast({
        description: t.quote.valid_min,
        variant: "destructive"
      });
      return;
    }
    
    if (fromCountry === toCountry) {
      toast({
        description: t.quote.valid_diff,
        variant: "destructive"
      });
      return;
    }

    trackEvent('quote_submit', { amount: amountNum, from: fromCountry, to: toCountry });

    setLoading(true);
    try {
      const ipayxFee = 0.007; // 0.7% iPAYX fee (constant)
      
      // Fetch 3 different routes with different priorities
      const [fastestResult, cheapestResult, balancedResult] = await Promise.all([
        findOptimalRoute({
          fromCurrency: fromCountry,
          toCurrency: toCountry,
          amount: amountNum,
          priority: 'speed'
        }),
        findOptimalRoute({
          fromCurrency: fromCountry,
          toCurrency: toCountry,
          amount: amountNum,
          priority: 'cost'
        }),
        findOptimalRoute({
          fromCurrency: fromCountry,
          toCurrency: toCountry,
          amount: amountNum,
          priority: 'balanced'
        })
      ]);

      // Partner fees for each route type (realistic values)
      const railPartnerFeeFastest = 0.015; // 1.5% rail partner fee (fastest)
      const railPartnerFeeCheapest = 0.009; // 0.9% rail partner fee (cheapest)
      const railPartnerFeeBalanced = 0.012; // 1.2% rail partner fee (balanced)

      setRoutes([
        {
          rail: fastestResult.breakdown[0]?.provider || 'Multi-hop Route',
          feePct: railPartnerFeeFastest + ipayxFee, // 2.2% TOTAL
          railPartnerFee: railPartnerFeeFastest,
          etaMin: Math.ceil(fastestResult.totalEtaSec / 60),
          breakdown: fastestResult.breakdown,
          ipayxFee: "0.70%",
          savings: fastestResult.savings,
          type: 'fastest',
          totalFeePct: (railPartnerFeeFastest + ipayxFee) * 100,
          totalEtaSec: fastestResult.totalEtaSec
        },
        {
          rail: cheapestResult.breakdown[0]?.provider || 'Direct Route',
          feePct: railPartnerFeeCheapest + ipayxFee, // 1.6% TOTAL
          railPartnerFee: railPartnerFeeCheapest,
          etaMin: Math.ceil(cheapestResult.totalEtaSec / 60),
          breakdown: cheapestResult.breakdown,
          ipayxFee: "0.70%",
          savings: cheapestResult.savings,
          type: 'cheapest',
          totalFeePct: (railPartnerFeeCheapest + ipayxFee) * 100,
          totalEtaSec: cheapestResult.totalEtaSec
        },
        {
          rail: balancedResult.breakdown[0]?.provider || 'Balanced Route',
          feePct: railPartnerFeeBalanced + ipayxFee, // 1.9% TOTAL
          railPartnerFee: railPartnerFeeBalanced,
          etaMin: Math.ceil(balancedResult.totalEtaSec / 60),
          breakdown: balancedResult.breakdown,
          ipayxFee: "0.70%",
          savings: balancedResult.savings,
          type: 'balanced',
          totalFeePct: (railPartnerFeeBalanced + ipayxFee) * 100,
          totalEtaSec: balancedResult.totalEtaSec
        }
      ]);

      trackEvent('quote_success', { 
        route_count: 3,
        amount: amountNum
      });
    } catch (err: any) {
      const code = err.status || 500;
      trackEvent('quote_error', { code });
      
      if (code === 503) {
        toast({
          description: t.quote.error_provider,
          variant: "destructive"
        });
      } else {
        toast({
          title: t.quote.error,
          description: err.message || t.quote.failedRoutes,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const exportPDF = () => {
    // Fix: Validate routes exist before exporting
    if (!routes || routes.length === 0) {
      toast({
        title: "No Routes Available",
        description: "Please generate a quote first before exporting PDF",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text("iPAYX Protocol", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Cross-Border Payment Quote", pageWidth / 2, 28, { align: "center" });
    
    // Corridor Info
    doc.setFontSize(14);
    doc.text("Payment Details", 20, 45);
    doc.setFontSize(10);
    doc.text(`From: ${fromCountry}`, 20, 55);
    doc.text(`To: ${toCountry}`, 20, 62);
    doc.text(`Amount: $${parseFloat(amount).toLocaleString()}`, 20, 69);
    
    // All 3 Routes
    let y = 85;
    routes.forEach((route, idx) => {
      const routeTypes = ['FASTEST', 'CHEAPEST', 'BALANCED'];
      doc.setFontSize(14);
      doc.text(`${routeTypes[idx]} Route`, 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.text(`Fee: ${(route.feePct * 100).toFixed(2)}% | Time: ${route.etaMin} min`, 25, y);
      y += 7;
      
      if (route.breakdown) {
        route.breakdown.forEach((hop: any, hopIdx: number) => {
          doc.text(`  ${hopIdx + 1}. ${hop.provider}: ${hop.from} → ${hop.to}`, 30, y);
          y += 5;
        });
      }
      y += 8;
    });
    
    // Legal Disclaimer
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const disclaimer = "LEGAL DISCLAIMER: Estimated savings are based on industry-average traditional wire fees (~2.5%). Actual costs may vary. Not a guarantee.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 40);
    doc.text(splitDisclaimer, 20, y);
    
    // Save
    doc.save(`ipayx-quote-${fromCountry}-${toCountry}.pdf`);
    
    toast({
      title: t.quote.pdfExported,
      description: t.quote.quoteSaved
    });
  };

  // Fix #1: SUPPRIMÉ - Cette condition bloquait l'affichage du formulaire au premier chargement

  return (
    <div lang={language} className="min-h-screen bg-background py-24 px-4">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1 mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.quote.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.quote.subtitle}
          </p>
          
          <div className="flex items-center justify-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium">🔗 Powered by Chainlink & iPAYX Protocol</span>
            </div>
          </div>
          
          {/* Pricing explanation */}
          <div className="flex items-center justify-center mt-4">
            <Card className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 border-primary/30">
              <div className="text-sm">
                <span className="font-semibold text-primary">How iPAYX Pricing Works:</span>
                <span className="text-muted-foreground ml-2">
                  We find the best partner rate for you (typically 0.9-1.5%) + add 0.7% iPAYX protocol fee. 
                  Total shown = partner fee + iPAYX fee.
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Input Section */}
        <Card className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* From Country - LIBRE INPUT */}
            <div className="space-y-2 relative">
              <Label htmlFor="from">{t.quote.fromCountry}</Label>
              <Input
                id="from"
                value={fromCountry}
                onChange={(e) => {
                  setFromCountry(e.target.value);
                  setShowFromSuggestions(true);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                placeholder={language === 'fr' ? 'Tapez votre pays (ex: Canada, Suisse, Maroc...)' : 'Type your country (e.g., Canada, Switzerland, Morocco...)'}
                className="h-12"
              />
              
              {/* Suggestions OPTIONNELLES */}
              {showFromSuggestions && fromCountry && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto">
                  {countries
                    .filter((c) =>
                      c.name.toLowerCase().includes(fromCountry.toLowerCase()) ||
                      c.code.toLowerCase().includes(fromCountry.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((c) => (
                      <div
                        key={c.code}
                        className="px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          setFromCountry(c.name);
                          setShowFromSuggestions(false);
                        }}
                      >
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {language === 'fr' 
                  ? '💡 Vous pouvez taper n\'importe quel pays, même s\'il n\'est pas dans les suggestions' 
                  : '💡 You can type any country name, even if not in suggestions'}
              </p>
            </div>

            {/* To Country - LIBRE INPUT */}
            <div className="space-y-2 relative">
              <Label htmlFor="to">{t.quote.toCountry}</Label>
              <Input
                id="to"
                value={toCountry}
                onChange={(e) => {
                  setToCountry(e.target.value);
                  setShowToSuggestions(true);
                }}
                onFocus={() => setShowToSuggestions(true)}
                onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                placeholder={language === 'fr' ? 'Tapez votre pays (ex: Canada, Suisse, Maroc...)' : 'Type your country (e.g., Canada, Switzerland, Morocco...)'}
                className="h-12"
              />
              
              {/* Suggestions OPTIONNELLES */}
              {showToSuggestions && toCountry && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto">
                  {countries
                    .filter((c) =>
                      c.name.toLowerCase().includes(toCountry.toLowerCase()) ||
                      c.code.toLowerCase().includes(toCountry.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((c) => (
                      <div
                        key={c.code}
                        className="px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          setToCountry(c.name);
                          setShowToSuggestions(false);
                        }}
                      >
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {language === 'fr' 
                  ? '💡 Vous pouvez taper n\'importe quel pays, même s\'il n\'est pas dans les suggestions' 
                  : '💡 You can type any country name, even if not in suggestions'}
              </p>
            </div>

            {/* Amount */}
            <div className="md:col-span-2 space-y-4">
              <Label htmlFor="amount">{t.quote.amountUSD}</Label>
              
              {/* Display dynamique */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  ${formatAmount(parseFloat(amount))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.quote.slideOrEnter}
                </p>
              </div>
              
              {/* Slider */}
              <Slider
                value={[parseFloat(amount)]}
                onValueChange={(values) => setAmount(values[0].toString())}
                min={1000}
                max={10000000}
                step={10000}
                className="w-full"
              />
              
              {/* Input manuel */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-12 text-lg text-center"
                  placeholder={t.quote.orEnterManually}
                />
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                <p>{t.quote.minMax}</p>
              </div>
            </div>

          </div>

          {/* Get Quote Button */}
          <Button
            className="w-full mt-6 h-14 text-lg"
            size="lg"
            onClick={handleGetQuote}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.quote.findingRoutes}
              </>
            ) : (
              <>
                {t.quote.getBestRoutes}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Email Results Button */}
          {routes.length > 0 && (
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('send-client-results', {
                      body: {
                        fromCurrency: fromCountry,
                        toCurrency: toCountry,
                        amount: parseFloat(amount),
                        breakdown: routes[0].breakdown,
                        totalFeePct: routes[0].feePct * 100,
                        ipayxFee: routes[0].ipayxFee,
                        savings: routes[0].savings,
                        clientEmail: 'client@example.com'
                      }
                    });

                    if (error) throw error;

                    toast({
                      title: t.quote.emailSent,
                      description: t.quote.resultsSent
                    });
                  } catch (err: any) {
                    toast({
                      title: t.quote.error,
                      description: err.message,
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t.quote.emailToSupport}
              </Button>
              
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={exportPDF}
                disabled={!routes || routes.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t.quote.exportPDF}
              </Button>
            </div>
          )}
        </Card>

        {/* Results Section */}
        {routes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">{t.quote.yourOptions}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {routes.map((route, idx) => (
                <RouteCard
                  key={idx}
                  type={route.type}
                  provider={route.rail}
                  feePct={route.feePct}
                  railPartnerFee={route.railPartnerFee}
                  feeUSD={parseFloat(amount) * route.feePct}
                  etaMin={route.etaMin}
                  breakdown={route.breakdown}
                  ipayxFee={route.ipayxFee}
                  savings={route.savings}
                />
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="mt-8 max-w-2xl mx-auto">
              <PaymentMethodSelector
                amount={parseFloat(amount)}
                currency="USD"
                country={fromCountry}
                email={userEmail}
              />
            </div>
            
            {/* Compact Legal Disclaimer */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-muted">
              <div className="flex items-start gap-2">
                <div className="text-xs mt-0.5">⚠️</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Important Disclaimer</p>
                  <p>
                    Estimated savings are compared to traditional wire transfers (approx. 2.5%). 
                    Actual costs may vary based on exchange rate fluctuations, network congestion, 
                    and third-party service agreements. iPAYX is not liable for variations. 
                    By proceeding, you acknowledge these estimates are for informational purposes only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
