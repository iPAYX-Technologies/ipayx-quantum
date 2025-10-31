import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <Cookie className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">What Are Cookies?</h2>
              <p>Cookies are small text files stored on your device when you visit iPAYX Protocol V4. They help us provide a secure, efficient service and remember your preferences.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Essential Cookies (Required)</h3>
                  <p>Cannot be disabled. Necessary for:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Session management and authentication</li>
                    <li>Security and fraud prevention</li>
                    <li>API rate limiting</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Analytics Cookies (Optional)</h3>
                  <p>Help us understand usage patterns:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Page views and navigation flow</li>
                    <li>Feature usage statistics</li>
                    <li>Performance monitoring</li>
                  </ul>
                  <p className="mt-2 text-sm">All analytics data is anonymized.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. Performance Cookies (Technical)</h3>
                  <p>Optimize service delivery:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>CDN caching for faster load times</li>
                    <li>Load balancing across servers</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Managing Your Cookie Preferences</h2>
              <p>You can manage cookies via:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Cookie Banner:</strong> Appears on first visit—customize settings there</li>
                <li><strong>Browser Settings:</strong> Most browsers allow you to block/delete cookies</li>
                <li><strong>Do Not Track:</strong> We respect DNT browser signals</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Note: Blocking essential cookies will prevent login and API access.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Third-Party Cookies</h2>
              <p>We do NOT use third-party advertising cookies. Limited third-party cookies from:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>CDN providers (technical necessity for global delivery)</li>
                <li>Analytics tools (only if you consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">GDPR & CCPA Compliance</h2>
              <p>Your rights under data protection laws:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Consent:</strong> We ask for explicit consent for non-essential cookies</li>
                <li><strong>Withdraw:</strong> Change preferences anytime via banner or browser</li>
                <li><strong>Transparency:</strong> Full disclosure of what each cookie does</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h2>
              <p>Questions about our cookie policy?</p>
              <div className="mt-3">
                <p><strong>Email:</strong> <a href="mailto:privacy@ipayx.ai" className="text-cyan-400 hover:underline">privacy@ipayx.ai</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
