import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreditCard, Info, Smartphone, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PaymentButtonProps {
  amount: string;
  currency: string;
  email: string;
  description?: string;
}

export function PaymentButton({ amount, currency, email, description }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  async function handlePayWithCoinbase() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('coinbase-checkout', {
        body: {
          amount,
          currency,
          description: description || 'iPayX Payment Route',
          customerEmail: email,
        },
      });

      if (error) throw error;

      // Redirect to Coinbase Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: t.payment.error,
        description: err.message || t.payment.errorDescription,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          {t.payment.disclaimer}
        </AlertDescription>
      </Alert>

      {/* Payment Button */}
      <Button
        onClick={handlePayWithCoinbase}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white hover:shadow-lg transition-all"
        size="lg"
      >
        <CreditCard className="mr-2 h-5 w-5" />
        {loading ? t.payment.processing : t.payment.button}
      </Button>

      {/* Payment Methods */}
      <div className="flex justify-center items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          <span>{t.payment.card}</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3" />
          <span>{t.payment.applePay}</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>🇨🇦 {t.payment.interac}</span>
        </div>
      </div>
    </div>
  );
}
