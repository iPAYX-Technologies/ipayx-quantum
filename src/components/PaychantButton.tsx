import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Info, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { openPaychantWidget, PAYCHANT_ASSETS } from "@/integrations/paychant";

interface PaychantButtonProps {
  amount: string;
  currency: string;
  email: string;
  description?: string;
}

export function PaychantButton({ 
  amount, 
  currency, 
  email, 
  description 
}: PaychantButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();

  async function handlePayWithPaychant() {
    setLoading(true);
    
    try {
      // Log transaction attempt
      console.log('🌍 Paychant payment initiated:', { amount, currency, email });

      // Open Paychant widget
      openPaychantWidget({
        action: 'buy',
        asset: PAYCHANT_ASSETS.USDC_STELLAR,
        amount: amount,
      });

      // Show success toast
      toast({
        title: language === 'fr' ? "Redirection vers Paychant" : "Redirecting to Paychant",
        description: language === 'fr' 
          ? "Fenêtre de paiement ouverte. Complétez votre transaction." 
          : "Payment window opened. Complete your transaction.",
      });

    } catch (err: any) {
      console.error('❌ Paychant error:', err);
      toast({
        title: language === 'fr' ? "Erreur Paychant" : "Paychant Error",
        description: err.message || "Failed to open Paychant widget",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-sm text-green-900 dark:text-green-100">
          {language === 'fr' 
            ? "🌍 Paiement via rails africains (Mobile Money, USSD, Bank Transfer)" 
            : "🌍 Payment via African rails (Mobile Money, USSD, Bank Transfer)"}
        </AlertDescription>
      </Alert>

      {/* Payment Button */}
      <Button
        onClick={handlePayWithPaychant}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg transition-all"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </>
        ) : (
          <>
            <Globe className="mr-2 h-5 w-5" />
            {language === 'fr' ? 'Payer via Paychant' : 'Pay with Paychant'}
          </>
        )}
      </Button>

      {/* Payment Methods */}
      <div className="flex justify-center items-center gap-3 text-xs text-muted-foreground">
        <span>📱 Mobile Money</span>
        <span>•</span>
        <span>🏦 Bank Transfer</span>
        <span>•</span>
        <span>💰 USDC/USDT</span>
      </div>
    </div>
  );
}
