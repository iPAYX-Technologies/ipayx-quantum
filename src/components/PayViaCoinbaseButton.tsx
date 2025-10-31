import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PayViaCoinbaseButtonProps {
  amount: string;
  currency: string;
  email: string;
  description?: string;
}

export function PayViaCoinbaseButton({ 
  amount, 
  currency, 
  email, 
  description 
}: PayViaCoinbaseButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayWithCoinbase() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('coinbase-checkout', {
        body: {
          amount,
          currency,
          description: description || 'iPayX Payment',
          customerEmail: email,
        },
      });

      if (error) throw error;

      // Redirect to Coinbase Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Coinbase payment error:', err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate Coinbase payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-sm text-green-900 dark:text-green-100">
          Pay with Interac e-Transfer (Canada) or Credit/Debit Card via Coinbase Commerce
        </AlertDescription>
      </Alert>

      <Button
        onClick={handlePayWithCoinbase}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg transition-all"
        size="lg"
      >
        <Smartphone className="mr-2 h-5 w-5" />
        {loading ? 'Processing...' : 'Pay with Coinbase'}
      </Button>

      <div className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>🇨🇦 Interac</span>
        <span>•</span>
        <span>💳 Cards</span>
        <span>•</span>
        <span>🍎 Apple Pay</span>
      </div>
    </div>
  );
}
