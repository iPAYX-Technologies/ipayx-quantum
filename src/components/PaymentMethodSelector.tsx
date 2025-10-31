// Cache invalidation - 2025-10-29 13:35
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BankTransferButton } from "./BankTransferButton";
import { PaymentButton } from "./PaymentButton";
import { PaychantButton } from "./PaychantButton";
import { MetaMaskButton } from "./MetaMaskButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  amount: number;
  currency: string;
  country?: string;
  email?: string;
}

export function PaymentMethodSelector({ 
  amount, 
  currency,
  country = "US",
  email = "user@example.com"
}: PaymentMethodSelectorProps) {
  const { t } = useLanguage();
  const payment = t.payment as any;
  
  const [selectedMethod, setSelectedMethod] = useState<string>(() => {
    if (amount < 25000) return "coinbase";
    if (amount < 100000) return "paychant";
    return "wire";
  });

  const paymentOptions = [
    {
      key: "coinbase",
      icon: "🇨🇦",
      name: "Coinbase (Interac/Card)",
      description: "Canadian customers",
      benefits: [
        payment?.interacTransfer || "Interac e-Transfer",
        payment?.creditDebitCards || "Credit/Debit cards",
        payment?.applePay || "Apple Pay"
      ],
      isEnabled: (amount: number) => amount < 25000,
      disabledReason: payment?.unavailable || "Available for amounts under $25,000 only",
      component: PaymentButton
    },
    {
      key: "paychant",
      icon: "🌍",
      name: payment?.paychant || "Paychant (Africa)",
      description: payment?.paychantDescription || "African rails",
      benefits: [
        "Mobile Money",
        "USDC/USDT",
        payment?.instant || "Instant"
      ],
      isEnabled: () => true,
      disabledReason: "",
      component: PaychantButton
    },
    {
      key: "wire",
      icon: "🏦",
      name: payment?.wire || "Wire Transfer",
      description: "Bank transfer",
      benefits: [
        payment?.allAmounts || "All amounts",
        payment?.secureBanking || "Secure",
        payment?.oneToTwoDays || "1-2 days"
      ],
      isEnabled: () => true,
      disabledReason: "",
      component: BankTransferButton
    },
    {
      key: "metamask",
      icon: "🦊",
      name: payment?.metamask || "MetaMask (Crypto)",
      description: payment?.metamaskDescription || "USDC/HBAR payments",
      benefits: [
        "Polygon (USDC)",
        "Hedera (HBAR)",
        payment?.cryptoPayments || "Crypto payments"
      ],
      isEnabled: () => true,
      disabledReason: "",
      component: MetaMaskButton
    }
  ];

  const getRecommendedMethod = (amount: number): string => {
    if (amount < 25000) return "coinbase";
    if (amount < 100000) return "paychant";
    return "wire";
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center">
        {payment?.chooseMethod || "Choose Your Payment Method"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentOptions.map(option => {
          const isEnabled = typeof option.isEnabled === 'function' 
            ? option.isEnabled(amount) 
            : option.isEnabled;
          const isRecommended = option.key === getRecommendedMethod(amount);
          const isSelected = selectedMethod === option.key;
          
          return (
            <Card
              key={option.key}
              className={cn(
                "relative p-6 cursor-pointer transition-all hover:shadow-lg",
                isSelected && "border-2 border-primary ring-2 ring-primary/20",
                !isEnabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isEnabled && setSelectedMethod(option.key)}
            >
              {/* Badge RECOMMENDED */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {payment?.recommended || "RECOMMENDED"}
                </div>
              )}
              
              {/* Icon */}
              <div className="text-4xl mb-3 text-center">{option.icon}</div>
              
              {/* Name */}
              <h3 className="font-bold text-lg mb-1 text-center">{option.name}</h3>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 text-center">{option.description}</p>
              
              {/* Benefits */}
              <div className="space-y-2 mb-4">
                {option.benefits.map(benefit => (
                  <div key={benefit} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              {/* Availability warning for disabled options */}
              {!isEnabled && option.disabledReason && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="text-xs">
                    {option.disabledReason}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          );
        })}
      </div>

      {/* Payment Component Section */}
      {selectedMethod && (
        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-center">
              Complete Your Payment
            </h4>
            {(() => {
              const selectedOption = paymentOptions.find(o => o.key === selectedMethod);
              if (!selectedOption) return null;
              
              const Component = selectedOption.component;
              const isEnabled = typeof selectedOption.isEnabled === 'function'
                ? selectedOption.isEnabled(amount)
                : selectedOption.isEnabled;

              if (!isEnabled) {
                return (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {selectedOption.disabledReason}
                    </AlertDescription>
                  </Alert>
                );
              }

              const componentProps: any = {
                amount: amount.toString(),
                currency: currency,
                email: email,
              };

              // Only BankTransferButton needs country
              if (selectedMethod === "wire") {
                componentProps.country = country;
              }

              return <Component {...componentProps} />;
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
