import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMetaMask } from "@/hooks/useMetaMask";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wallet, Info, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MetaMaskButtonProps {
  amount: string;
  currency: string;
  recipientAddress?: string;
  onSuccess?: (txHash: string) => void;
}

export function MetaMaskButton({ 
  amount, 
  currency,
  recipientAddress = import.meta.env.VITE_IPAYX_WALLET_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  onSuccess 
}: MetaMaskButtonProps) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string>('');
  const { 
    account, 
    chainId, 
    isConnected, 
    isInstalled, 
    hederaAccount,
    isHederaConnected,
    connect, 
    connectHedera,
    sendHederaTransaction,
    switchNetwork 
  } = useMetaMask();
  const { t } = useLanguage();
  const payment = t.payment as any;

  // Validate environment variable on mount
  React.useEffect(() => {
    if (!import.meta.env.VITE_IPAYX_WALLET_ADDRESS) {
      console.warn('⚠️ VITE_IPAYX_WALLET_ADDRESS not configured, using fallback address');
    }
  }, []);

  async function handlePayWithMetaMask() {
    setLoading(true);
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: payment.authRequired || "Authentication Required",
          description: payment.authRequiredDescription || "Please login to complete payment",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 🔹 HEDERA PAYMENT PATH (via Snap)
      if (currency === 'HBAR' || recipientAddress.startsWith('0.0.')) {
        // Connect Hedera Snap if not connected
        if (!isHederaConnected) {
          await connectHedera();
          toast({
            title: "Hedera Wallet Connected",
            description: `Account: ${hederaAccount}`,
          });
        }

        // Send HBAR transaction via Snap
        const hederaTx = await sendHederaTransaction({
          to: recipientAddress,
          amount: amount,
          memo: `iPAYX payment - ${currency}`
        });

        setTxHash(hederaTx.transactionId);
        setExplorerUrl(`https://hashscan.io/mainnet/transaction/${hederaTx.transactionId}`);

        // Log transaction in backend
        await supabase.functions.invoke('metamask-payment', {
          body: {
            txHash: hederaTx.transactionId,
            from: hederaAccount,
            to: recipientAddress,
            amount: parseFloat(amount),
            asset: currency,
            chainId: 'hedera-mainnet',
            userId: user.id
          }
        });

        toast({
          title: payment.success || "Payment Successful",
          description: `Hedera Tx: ${hederaTx.transactionId.slice(0, 20)}...`,
        });

        if (onSuccess) {
          onSuccess(hederaTx.transactionId);
        }
        return;
      }

      // 🔹 EVM PAYMENT PATH (Polygon USDC)
      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        await connect();
      }

      // Step 2: Switch to Polygon if not already (lowest gas fees)
      if (chainId !== 137) {
        await switchNetwork(137);
      }

      // Step 3: Get USDC contract address on Polygon
      const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
      const amountInWei = (parseFloat(amount) * 1e6).toString(); // USDC has 6 decimals

      // Step 4: Send transaction
      const transactionParameters = {
        to: USDC_ADDRESS,
        from: account,
        data: `0xa9059cbb${recipientAddress.slice(2).padStart(64, '0')}${parseInt(amountInWei).toString(16).padStart(64, '0')}`
      };

      const txHashResult = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setTxHash(txHashResult);
      setExplorerUrl(`https://polygonscan.com/tx/${txHashResult}`);

      // Step 5: Log transaction in backend
      await supabase.functions.invoke('metamask-payment', {
        body: {
          txHash: txHashResult,
          from: account,
          to: recipientAddress,
          amount: parseFloat(amount),
          asset: currency,
          chainId: 137,
          userId: user.id
        }
      });

      toast({
        title: payment.success || "Payment Successful",
        description: `Transaction: ${txHashResult.slice(0, 10)}...`,
      });

      if (onSuccess) {
        onSuccess(txHashResult);
      }
    } catch (err: any) {
      console.error('MetaMask payment error:', err);
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
      <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
          {isInstalled 
            ? (isConnected 
                ? payment.metamaskConnected || `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` 
                : payment.metamaskNotConnected || "Click to connect your MetaMask wallet")
            : payment.metamaskNotInstalled || "MetaMask not installed. Click to download."}
        </AlertDescription>
      </Alert>

      {txHash && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-sm text-green-900 dark:text-green-100">
            Transaction sent! View on{" "}
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              {currency === 'HBAR' ? 'HashScan' : 'PolygonScan'}
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handlePayWithMetaMask}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg transition-all"
        size="lg"
      >
        <Wallet className="mr-2 h-5 w-5" />
        {loading 
          ? t.payment.processing 
          : (isConnected 
              ? payment.metamaskPay || "Pay with MetaMask" 
              : payment.metamaskConnect || "Connect MetaMask")}
      </Button>

      <div className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>🦊 MetaMask</span>
        <span>•</span>
        <span>{currency === 'HBAR' ? '🅷 Hedera' : '🔗 Polygon'}</span>
        <span>•</span>
        <span>💰 {currency}</span>
      </div>
    </div>
  );
}
