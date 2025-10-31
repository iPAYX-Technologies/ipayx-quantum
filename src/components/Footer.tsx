import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Mail } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo + Location */}
          <div>
            <h3 className="text-lg font-bold mb-2">iPAYX Protocol V4</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Multi-Rail Cross-Chain Payment Infrastructure
            </p>
            <p className="text-sm text-cyan-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Montreal, Canada
            </p>
          </div>

          {/* Contact Emails */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">{t.footer.contact}</h4>
            <div className="space-y-2 text-sm">
              <a 
                href="mailto:sales@ipayx.ai" 
                className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400 transition-colors group"
              >
                <Mail className="h-3.5 w-3.5 group-hover:text-cyan-400" />
                {t.footer.sales}
              </a>
              <a 
                href="mailto:partnerships@ipayx.ai" 
                className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400 transition-colors group"
              >
                <Mail className="h-3.5 w-3.5 group-hover:text-cyan-400" />
                {t.footer.partnerships}
              </a>
              <a 
                href="mailto:support@ipayx.ai" 
                className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400 transition-colors group"
              >
                <Mail className="h-3.5 w-3.5 group-hover:text-cyan-400" />
                {t.footer.support}
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">{t.footer.legal}</h4>
            <div className="space-y-2 text-sm">
              <Link to="/legal" className="block text-muted-foreground hover:text-cyan-400 transition-colors">
                {t.footer.legal}
              </Link>
              <Link to="/privacy" className="block text-muted-foreground hover:text-cyan-400 transition-colors">
                {t.footer.privacy}
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-cyan-400 transition-colors">
                {t.footer.terms}
              </Link>
              <Link to="/cookies" className="block text-muted-foreground hover:text-cyan-400 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 pt-6 space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 iPAYX Protocol V4
            </div>
            <div className="text-xs text-cyan-400 font-semibold tracking-wider">
              QUANTUM RAIL™
            </div>
          </div>
          {/* Compliance Certifications */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground text-center">
              Non-Custodial Protocol | Smart Contract Audited
            </div>
            
            {/* MSB FINTRAC Compliance Notice */}
            <div className="text-[10px] text-muted-foreground/70 text-center leading-relaxed max-w-4xl mx-auto">
              iPayX Technologies Inc. is registered as a Money Services Business (MSB) with the Financial Transactions and Reports Analysis Centre of Canada (FINTRAC / CANAFE) under Canada's Proceeds of Crime and Terrorist Financing Act (PCMLTFA). Publication on the FINTRAC public registry pending official update.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}