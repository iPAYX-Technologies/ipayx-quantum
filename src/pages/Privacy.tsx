import { Card } from "@/components/ui/card";
import { Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/privacy-fr" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            Français
          </Link>
        </div>

        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <Shield className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Information We Collect</h2>
              <p>iPAYX Protocol V4 collects minimal information necessary to provide our payment routing services:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email address (for account creation and communication)</li>
                <li>Company name and country (for compliance and service optimization)</li>
                <li>Transaction metadata (amounts, corridors, timestamps - for routing optimization)</li>
                <li>API usage logs (for security and performance monitoring)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Your Data</h2>
              <p>Your data is used exclusively for:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Providing cross-border payment routing services</li>
                <li>Improving Meta-Router AI performance and accuracy</li>
                <li>Compliance with blockchain network security standards</li>
                <li>Security monitoring and fraud prevention</li>
                <li>Service communication and support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Data Storage & Security</h2>
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>End-to-end encryption for all API communications</li>
                <li>Data stored in enterprise-grade secure infrastructure</li>
                <li>Regular security audits and penetration testing</li>
                <li>No storage of private keys or wallet credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Third-Party Sharing</h2>
              <p><strong>We NEVER sell your data.</strong> Limited sharing only occurs for:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Payment processing partners (encrypted transaction routing only)</li>
                <li>Compliance authorities (when legally required by applicable regulations)</li>
                <li>Service providers (cloud hosting, monitoring - under strict NDAs)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Your Rights (GDPR & CCPA Compliance)</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate information</li>
                <li><strong>Erasure:</strong> Request deletion (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact: <a href="mailto:privacy@ipayx.ai" className="text-cyan-400 hover:underline">privacy@ipayx.ai</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Cookies & Tracking</h2>
              <p>We use minimal cookies for:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Essential:</strong> Session management and authentication (cannot be disabled)</li>
                <li><strong>Analytics:</strong> Anonymous usage statistics to improve UX (optional)</li>
                <li><strong>Performance:</strong> CDN caching and load balancing (technical necessity)</li>
              </ul>
              <p className="mt-3">Manage cookie preferences via our Cookie Consent banner or at <a href="/cookies" className="text-cyan-400 hover:underline">/cookies</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Data Retention</h2>
              <p>We retain data as follows:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Transaction logs:</strong> 7 years (regulatory requirement)</li>
                <li><strong>Account data:</strong> Duration of active account + 2 years</li>
                <li><strong>API logs:</strong> 90 days (security monitoring)</li>
                <li><strong>Marketing data:</strong> Until opt-out request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. International Data Transfers</h2>
              <p>iPAYX operates globally. Your data may be transferred to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Canada (primary jurisdiction)</li>
                <li>EU (GDPR-compliant data centers)</li>
                <li>USA (CCPA-compliant infrastructure)</li>
              </ul>
              <p className="mt-2">All transfers use Standard Contractual Clauses (SCCs) approved by EU authorities.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. Material changes will be notified via:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email to registered users (30 days notice)</li>
                <li>Prominent banner on our website</li>
                <li>Updated "Last modified" date at top of page</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Contact Us</h2>
              <p>For privacy-related inquiries:</p>
              <div className="mt-3 space-y-1">
                <p><strong>Email:</strong> <a href="mailto:privacy@ipayx.ai" className="text-cyan-400 hover:underline">privacy@ipayx.ai</a></p>
                <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@ipayx.ai" className="text-cyan-400 hover:underline">dpo@ipayx.ai</a></p>
                <p><strong>General Support:</strong> <a href="mailto:support@ipayx.ai" className="text-cyan-400 hover:underline">support@ipayx.ai</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
