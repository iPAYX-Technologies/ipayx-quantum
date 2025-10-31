import { Card } from "@/components/ui/card";
import { FileText, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/terms-fr" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            Français
          </Link>
        </div>

        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <FileText className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using iPAYX Protocol V4 ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Description of Service</h2>
              <p>iPAYX Protocol V4 is a <strong>non-custodial payment routing layer</strong> that connects multiple blockchain networks and traditional payment rails. We provide:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Meta-Router AI for optimal payment routing</li>
                <li>Multi-chain API access (15+ blockchains)</li>
                <li>FX rate oracles (Chainlink + Pyth)</li>
                <li>Sandbox and production environments</li>
              </ul>
              <p className="mt-3 font-semibold">CRITICAL: iPAYX is NOT a bank, NOT a money transmitter, and does NOT hold your funds at any point.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Accounts</h2>
              <p>To use the Service, you must:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Be at least 18 years old (or age of majority in your jurisdiction)</li>
                <li>Represent a legitimate business entity (for production API access)</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your API keys and credentials</li>
              </ul>
              <p className="mt-3"><strong>You are responsible for all activity under your account.</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Prohibited Uses</h2>
              <p>You agree NOT to use the Service for:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Money laundering, terrorist financing, or other illegal activities</li>
                <li>Transactions involving sanctioned countries/entities (OFAC, UN, EU lists)</li>
                <li>High-risk jurisdictions (as defined by FATF)</li>
                <li>Fraudulent or deceptive practices</li>
                <li>Circumventing KYC/AML requirements</li>
                <li>Automated scraping or API abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Pricing & Fees</h2>
              <p>Current pricing structure:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Transaction Fee:</strong> 0.7% flat (USD equivalent) per transaction</li>
                <li><strong>No hidden fees:</strong> Transparent pricing, no setup costs</li>
                <li><strong>Volume discounts:</strong> Available for 100K+ monthly volume (contact sales)</li>
                <li><strong>Network fees:</strong> Blockchain gas fees are passed through at cost (not marked up)</li>
              </ul>
              <p className="mt-3">Pricing is subject to change with 30 days notice to active users.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Protocol Architecture & Compliance</h2>
              <p>iPAYX operates as a non-custodial routing protocol:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Non-Custodial:</strong> We never take custody of user funds</li>
                <li><strong>Smart Contract Audited:</strong> Code audited by Certik & OpenZeppelin</li>
                <li><strong>Compliance:</strong> Delegated to licensed liquidity partners when required</li>
                <li><strong>Open-Source:</strong> Protocol design is transparent and auditable</li>
              </ul>
              <p className="mt-3">Users must comply with local regulations in their jurisdiction. iPAYX does not hold money transmitter licenses as we operate as a non-custodial routing layer only.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h2>
              <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>iPAYX provides the Service "AS IS" without warranties of any kind</li>
                <li>We are NOT liable for blockchain network failures, delays, or congestion</li>
                <li>We are NOT liable for losses due to incorrect wallet addresses</li>
                <li>We are NOT liable for FX rate fluctuations during settlement</li>
                <li>Total liability capped at fees paid by you in the last 12 months</li>
              </ul>
              <p className="mt-3 font-semibold">iPAYX is a routing layer—we NEVER custody your funds. You are responsible for securing your own wallets and private keys.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Indemnification</h2>
              <p>You agree to indemnify and hold harmless iPAYX and its affiliates from any claims arising from:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Your violation of these Terms</li>
                <li>Your violation of any law or regulation</li>
                <li>Unauthorized use of your API keys</li>
                <li>Disputes with third-party payment providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Termination</h2>
              <p>We may suspend or terminate your access immediately if:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>You violate these Terms</li>
                <li>We suspect fraudulent or illegal activity</li>
                <li>Required by law or regulatory authority</li>
                <li>You fail to pay fees owed</li>
              </ul>
              <p className="mt-3">You may terminate your account at any time by contacting support@ipayx.ai.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Dispute Resolution</h2>
              <p>Governing law and jurisdiction:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Governing Law:</strong> Laws of Ontario, Canada</li>
                <li><strong>Arbitration:</strong> Disputes resolved via binding arbitration (ADRIC rules)</li>
                <li><strong>Class Action Waiver:</strong> No class or representative actions permitted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">11. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email notification (30 days notice)</li>
                <li>Prominent banner on our website</li>
                <li>Updated "Last modified" date</li>
              </ul>
              <p className="mt-3">Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">12. Contact Information</h2>
              <div className="mt-3 space-y-1">
                <p><strong>General Support:</strong> <a href="mailto:support@ipayx.ai" className="text-cyan-400 hover:underline">support@ipayx.ai</a></p>
                <p><strong>Legal Inquiries:</strong> <a href="mailto:legal@ipayx.ai" className="text-cyan-400 hover:underline">legal@ipayx.ai</a></p>
                <p><strong>Compliance:</strong> <a href="mailto:compliance@ipayx.ai" className="text-cyan-400 hover:underline">compliance@ipayx.ai</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
