import { Card } from "@/components/ui/card";
import { FileText, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsFR() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/terms" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            English
          </Link>
        </div>

        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <FileText className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Conditions d'utilisation</h1>
              <p className="text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptation des conditions</h2>
              <p>En accédant ou en utilisant le Protocole iPAYX V4 (« Service »), vous acceptez d'être lié par ces Conditions d'utilisation (« Conditions »). Si vous n'êtes pas d'accord avec une partie des conditions, vous ne pouvez pas accéder au Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Description du service</h2>
              <p>Le Protocole iPAYX V4 est une <strong>couche de routage de paiement non-dépositaire</strong> qui connecte plusieurs réseaux blockchain et rails de paiement traditionnels. Nous fournissons :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Meta-Router IA pour un routage de paiement optimal</li>
                <li>Accès API multi-chaînes (15+ blockchains)</li>
                <li>Oracles de taux de change FX (Chainlink + Pyth)</li>
                <li>Environnements sandbox et production</li>
              </ul>
              <p className="mt-3 font-semibold">IMPORTANT : iPAYX n'est PAS une banque, n'est PAS un transmetteur d'argent, et ne détient JAMAIS vos fonds.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Comptes utilisateur</h2>
              <p>Pour utiliser le Service, vous devez :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Avoir au moins 18 ans (ou l'âge de la majorité dans votre juridiction)</li>
                <li>Représenter une entité commerciale légitime (pour l'accès API production)</li>
                <li>Fournir des informations exactes, actuelles et complètes</li>
                <li>Maintenir la sécurité de vos clés API et identifiants</li>
              </ul>
              <p className="mt-3"><strong>Vous êtes responsable de toute activité sous votre compte.</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Utilisations interdites</h2>
              <p>Vous acceptez de NE PAS utiliser le Service pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Blanchiment d'argent, financement du terrorisme ou autres activités illégales</li>
                <li>Transactions impliquant des pays/entités sanctionnés (listes OFAC, ONU, UE)</li>
                <li>Juridictions à haut risque (selon le GAFI)</li>
                <li>Pratiques frauduleuses ou trompeuses</li>
                <li>Contournement des exigences KYC/LAB</li>
                <li>Scraping automatisé ou abus d'API</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Tarification et frais</h2>
              <p>Structure tarifaire actuelle :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Frais de transaction :</strong> 0,7% forfaitaire (équivalent USD) par transaction</li>
                <li><strong>Pas de frais cachés :</strong> Tarification transparente, sans frais de configuration</li>
                <li><strong>Remises sur volume :</strong> Disponibles pour 100K+ de volume mensuel (contactez les ventes)</li>
                <li><strong>Frais de réseau :</strong> Les frais de gas blockchain sont répercutés au prix coûtant (sans majoration)</li>
              </ul>
              <p className="mt-3">La tarification peut changer avec un préavis de 30 jours aux utilisateurs actifs.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Architecture du Protocole & Conformité</h2>
              <p>iPAYX fonctionne comme un protocole de routage non-dépositaire :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Non-Dépositaire :</strong> Nous ne prenons jamais la garde de fonds utilisateur</li>
                <li><strong>Contrats Intelligents Audités :</strong> Code audité par Certik & OpenZeppelin</li>
                <li><strong>Conformité :</strong> Déléguée aux partenaires de liquidité licenciés lorsque requis</li>
                <li><strong>Open-Source :</strong> Conception du protocole transparente et auditable</li>
              </ul>
              <p className="mt-3">Les utilisateurs doivent se conformer aux réglementations locales de leur juridiction. iPAYX ne détient pas de licences de transmetteur d'argent car nous opérons uniquement comme couche de routage non-dépositaire.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitation de responsabilité</h2>
              <p><strong>DANS LA MESURE MAXIMALE PERMISE PAR LA LOI :</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>iPAYX fournit le Service "TEL QUEL" sans garantie d'aucune sorte</li>
                <li>Nous ne sommes PAS responsables des pannes, retards ou congestions du réseau blockchain</li>
                <li>Nous ne sommes PAS responsables des pertes dues à des adresses de portefeuille incorrectes</li>
                <li>Nous ne sommes PAS responsables des fluctuations du taux de change FX pendant le règlement</li>
                <li>Responsabilité totale limitée aux frais que vous avez payés au cours des 12 derniers mois</li>
              </ul>
              <p className="mt-3 font-semibold">iPAYX est une couche de routage—nous ne détenons JAMAIS vos fonds. Vous êtes responsable de sécuriser vos propres portefeuilles et clés privées.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Indemnisation</h2>
              <p>Vous acceptez d'indemniser et de dégager de toute responsabilité iPAYX et ses affiliés de toute réclamation découlant de :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Votre violation de ces Conditions</li>
                <li>Votre violation de toute loi ou réglementation</li>
                <li>Utilisation non autorisée de vos clés API</li>
                <li>Différends avec des fournisseurs de paiement tiers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Résiliation</h2>
              <p>Nous pouvons suspendre ou résilier votre accès immédiatement si :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Vous violez ces Conditions</li>
                <li>Nous soupçonnons une activité frauduleuse ou illégale</li>
                <li>Requis par la loi ou une autorité réglementaire</li>
                <li>Vous ne payez pas les frais dus</li>
              </ul>
              <p className="mt-3">Vous pouvez résilier votre compte à tout moment en contactant support@ipayx.ai.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Résolution des litiges</h2>
              <p>Loi applicable et juridiction :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Loi applicable :</strong> Lois de l'Ontario, Canada</li>
                <li><strong>Arbitrage :</strong> Litiges résolus par arbitrage exécutoire (règles ADRIC)</li>
                <li><strong>Renonciation aux recours collectifs :</strong> Aucun recours collectif ou représentatif permis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">11. Modifications des conditions</h2>
              <p>Nous nous réservons le droit de modifier ces Conditions à tout moment. Les changements importants seront communiqués par :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Notification par email (préavis de 30 jours)</li>
                <li>Bannière bien visible sur notre site web</li>
                <li>Date de "Dernière modification" mise à jour</li>
              </ul>
              <p className="mt-3">L'utilisation continue après les modifications constitue une acceptation.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">12. Coordonnées</h2>
              <div className="mt-3 space-y-1">
                <p><strong>Support général :</strong> <a href="mailto:support@ipayx.ai" className="text-cyan-400 hover:underline">support@ipayx.ai</a></p>
                <p><strong>Demandes juridiques :</strong> <a href="mailto:legal@ipayx.ai" className="text-cyan-400 hover:underline">legal@ipayx.ai</a></p>
                <p><strong>Conformité :</strong> <a href="mailto:compliance@ipayx.ai" className="text-cyan-400 hover:underline">compliance@ipayx.ai</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
