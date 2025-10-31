import { Card } from "@/components/ui/card";
import { AlertCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function LegalFR() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/legal" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            English
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Mentions légales</h1>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-8 space-y-6">
          {/* Main Disclaimer */}
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-4">
              <p className="text-lg font-semibold">Avis de non-responsabilité</p>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Ceci est un projet de démonstration créé à des fins éducatives et de test.
                  Toutes les données présentées sont des données fictives et ne représentent pas de réelles transactions financières
                  ou rails de paiement.
                </p>
              </div>
            </div>
          </div>

          {/* Critical Legal Notices */}
          <div className="border-t border-border/50 pt-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">⚠️ Avis légaux importants</h2>
            
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🏦 Le Protocole iPAYX n'est PAS une banque</p>
                <p className="text-muted-foreground">
                  Le Protocole iPAYX V4 est uniquement une couche d'infrastructure de routage de paiement. Nous n'acceptons PAS de dépôts, 
                  ne fournissons PAS de prêts, ni n'offrons de services bancaires. Nous ne sommes pas une institution financière.
                </p>
              </div>

              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🔓 Protocole SANS-KYC</p>
                <p className="text-muted-foreground">
                  iPAYX fonctionne comme une couche de routage non-dépositaire, SANS-KYC. Nous ne prenons JAMAIS la garde de vos fonds 
                  ni ne collectons d'informations KYC. Toutes les transactions sont du routage cross-chain pair-à-pair. 
                  Vos actifs restent sous votre contrôle en tout temps.
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">🔒 Architecture du Protocole</p>
                <p className="text-muted-foreground">
                  Le Protocole iPAYX V4 fonctionne comme une <strong>couche de méta-routage non-dépositaire</strong> :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                  <li>Aucune garde de fonds utilisateur à aucun moment du flux transactionnel</li>
                  <li>Routage uniquement par contrats intelligents (audités par Certik & OpenZeppelin)</li>
                  <li>Conformité gérée par les partenaires de liquidité licenciés lorsque requis</li>
                  <li>Conception de protocole open-source pour transparence et auditabilité</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  iPAYX ne détient pas de licences de transmetteur d'argent car nous ne prenons jamais la garde de fonds.
                </p>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">⚡ Aucun conseil financier</p>
                <p className="text-muted-foreground">
                  Les informations fournies sur cette plateforme sont à titre informatif uniquement et ne doivent 
                  PAS être interprétées comme des conseils financiers, d'investissement, fiscaux ou juridiques. Consultez toujours 
                  des professionnels financiers qualifiés avant de prendre toute décision de routage de paiement ou de 
                  transaction transfrontalière.
                </p>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="font-semibold text-foreground mb-2">📊 Divulgation des risques</p>
                <p className="text-muted-foreground">
                  Les transactions blockchain et cryptomonnaie comportent des risques inhérents incluant :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground ml-4">
                  <li>Irréversibilité des transactions une fois confirmées on-chain</li>
                  <li>Vulnérabilités de contrats intelligents (bien qu'audités par Certik & OpenZeppelin)</li>
                  <li>Volatilité du marché pour les actifs numériques</li>
                  <li>Changements réglementaires dans différentes juridictions</li>
                  <li>Congestion du réseau et frais de gas variables</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Third-Party Disclaimer */}
          <div className="border-t border-border/50 pt-6 space-y-3">
            <h2 className="text-xl font-bold text-foreground">🔗 Services tiers</h2>
            <p className="text-sm text-muted-foreground">
              Ce projet n'a aucune affiliation, approbation ou relation avec les 
              processeurs de paiement tiers, institutions financières ou fournisseurs de services mentionnés
              sur cette plateforme. Tous les noms d'entreprise, marques de commerce et marques de service sont la propriété de leurs
              propriétaires respectifs.
            </p>
            <p className="text-sm text-muted-foreground">
              Le Protocole iPAYX V4 s'intègre avec des partenaires de routage licenciés pour le règlement cross-chain, 
              mais reste indépendant. Chaque partenaire opère sous ses propres conditions et licences.
            </p>
          </div>

          {/* Contact & Copyright */}
          <div className="border-t border-border/50 pt-6 space-y-3">
            <h2 className="text-xl font-bold text-foreground">📧 Contact juridique</h2>
            <p className="text-sm text-muted-foreground">
              Pour les demandes juridiques, questions de conformité ou opportunités de partenariat :
            </p>
            <p className="text-sm font-medium text-primary">
              Email : <a href="mailto:legal@ipayx.ai" className="underline hover:text-primary/80">legal@ipayx.ai</a>
            </p>
            <p className="text-sm font-medium text-primary">
              Support : <a href="mailto:support@ipayx.ai" className="underline hover:text-primary/80">support@ipayx.ai</a>
            </p>
            <p className="font-medium text-foreground pt-4 text-sm">
              © 2025 Protocole iPAYX V4. Tous droits réservés.
            </p>
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : Janvier 2025
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
