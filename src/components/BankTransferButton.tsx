import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BankTransferButtonProps {
  amount: string;
  currency: string;
  email: string;
  country: string;
  description?: string;
}

export function BankTransferButton({ 
  amount, 
  currency, 
  email, 
  country, 
  description 
}: BankTransferButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleBankTransfer() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('circle-payment', {
        body: {
          amount: parseFloat(amount), // Convert string to number for Circle API
          currency,
          method: 'bank',
          description: description || 'iPayX Bank Transfer',
          customerEmail: email,
          country,
        },
      });

      if (error) throw error;

      // Redirect to Circle Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Bank transfer error:', err);
      toast({
        title: "Bank Transfer Error",
        description: err.message || "Failed to initiate bank transfer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const transferType = country === 'CA' ? 'Interac e-Transfer' : (country === 'US' ? 'ACH' : 'SEPA');
  const timeframe = country === 'CA' ? '1-2 jours ouvrables' : (country === 'US' ? '1-3 business days' : '1-2 business days');

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          {country === 'CA' 
            ? `🇨🇦 ${transferType} ou virement bancaire via Circle Gateway. Règlement en ${timeframe}.`
            : `${transferType} bank transfer via Circle Gateway. Settlement in ${timeframe}.`
          }
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleBankTransfer}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all"
        size="lg"
      >
        <Building2 className="mr-2 h-5 w-5" />
        {loading ? 'Processing...' : `Pay via ${transferType} Transfer`}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        Powered by Circle Gateway • Licensed Money Transmitter
      </div>
    </div>
  );
}
