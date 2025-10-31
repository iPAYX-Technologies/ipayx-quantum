import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { AlertCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function Legal() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/legal-fr" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            Français
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">{t.legal.title}</h1>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-8 space-y-6">
          {/* Main Disclaimer */}
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-4">
              <p className="text-lg font-semibold">{t.legal.disclaimer}</p>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  This is a demonstration project created for educational and testing purposes.
                  All data presented is mock data and does not represent real financial transactions
                  or payment rails.
                </p>
              </div>
            </div>
          </div>

          {/* Critical Legal Notices */}
          <div className="border-t border-border/50 pt-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">⚠️ Important Legal Notices</h2>
            
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🏦 iPAYX Protocol is NOT a Bank</p>
                <p className="text-muted-foreground">
                  iPAYX Protocol V4 is a payment routing infrastructure layer only. We do NOT accept deposits, 
                  provide loans, or offer banking services. We are not a financial institution.
                </p>
              </div>

              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🔓 NO-KYC Protocol</p>
                <p className="text-muted-foreground">
                  iPAYX operates as a non-custodial, NO-KYC routing layer. We NEVER take custody of your funds 
                  or collect KYC information. All transactions are peer-to-peer cross-chain routing. 
                  Your assets remain under your control at all times.
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🔒 Protocol Architecture</p>
                <p className="text-muted-foreground">
                  iPAYX Protocol V4 operates as a <strong>non-custodial meta-routing layer</strong>:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                  <li>Zero custody of user funds at any point in the transaction flow</li>
                  <li>Smart contract-based routing only (audited by Certik & OpenZeppelin)</li>
                  <li>Compliance handled by licensed liquidity partners when required</li>
                  <li>Open-source protocol design for transparency and auditability</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  iPAYX does not hold money transmitter licenses as we never custody funds.
                </p>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">⚡ No Financial Advice</p>
                <p className="text-muted-foreground">
                  The information provided on this platform is for informational purposes only and should 
                  NOT be construed as financial, investment, tax, or legal advice. Always consult with 
                  qualified financial professionals before making any payment routing or cross-border 
                  transaction decisions.
                </p>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">📊 Risk Disclosure</p>
                <p className="text-muted-foreground">
                  Blockchain and cryptocurrency transactions carry inherent risks including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                  <li>Irreversibility of transactions once confirmed on-chain</li>
                  <li>Smart contract vulnerabilities (though audited by Certik & OpenZeppelin)</li>
                  <li>Market volatility for digital assets</li>
                  <li>Regulatory changes in different jurisdictions</li>
                  <li>Network congestion and variable gas fees</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Third-Party Disclaimer */}
          <div className="border-t border-border/50 pt-6 space-y-3">
            <h2 className="text-xl font-bold text-foreground">🔗 Third-Party Services</h2>
            <p className="text-sm text-muted-foreground">
              This project has no affiliation with, endorsement from, or relationship to any
              third-party payment processors, financial institutions, or service providers mentioned
              on this platform. All company names, trademarks, and service marks are the property of their
              respective owners.
            </p>
            <p className="text-sm text-muted-foreground">
              iPAYX Protocol V4 integrates with licensed routing partners for cross-chain settlement, 
              but remains independent. Each partner operates under their own terms and licenses.
            </p>
          </div>

          {/* Contact & Copyright */}
          <div className="border-t border-border/50 pt-6 space-y-3">
            <h2 className="text-xl font-bold text-foreground">📧 Legal Contact</h2>
            <p className="text-sm text-muted-foreground">
              For legal inquiries, compliance questions, or partnership opportunities:
            </p>
            <p className="text-sm font-medium text-primary">
              Email: <a href="mailto:legal@ipayx.ai" className="underline hover:text-primary/80">legal@ipayx.ai</a>
            </p>
            <p className="text-sm font-medium text-primary">
              Support: <a href="mailto:support@ipayx.ai" className="underline hover:text-primary/80">support@ipayx.ai</a>
            </p>
            <p className="font-medium text-foreground pt-4 text-sm">
              © 2025 iPAYX Protocol V4. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Last Updated: January 2025
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}