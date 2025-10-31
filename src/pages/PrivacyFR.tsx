import { Card } from "@/components/ui/card";
import { Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyFR() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex justify-end mb-4">
          <Link 
            to="/privacy" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            English
          </Link>
        </div>

        <Card className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <Shield className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
              <p className="text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="space-y-6 text-foreground/80">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Informations collectées</h2>
              <p>Le Protocole iPAYX V4 collecte un minimum d'informations nécessaires pour fournir nos services de routage de paiement :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Adresse email (pour la création de compte et la communication)</li>
                <li>Nom de l'entreprise et pays (pour la conformité et l'optimisation du service)</li>
                <li>Métadonnées de transaction (montants, corridors, horodatages - pour l'optimisation du routage)</li>
                <li>Logs d'utilisation de l'API (pour la surveillance de la sécurité et des performances)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Utilisation de vos données</h2>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Fournir des services de routage de paiements transfrontaliers</li>
                <li>Améliorer les performances et la précision du Meta-Router IA</li>
                <li>Conformité avec les réglementations ESM canadien et CANAFE</li>
                <li>Surveillance de sécurité et prévention de la fraude</li>
                <li>Communication de service et support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Stockage et sécurité des données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Chiffrement de bout en bout pour toutes les communications API</li>
                <li>Données stockées dans une infrastructure sécurisée de niveau entreprise</li>
                <li>Audits de sécurité réguliers et tests de pénétration</li>
                <li>Aucun stockage de clés privées ou d'identifiants de portefeuille</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Partage avec des tiers</h2>
              <p><strong>Nous ne vendons JAMAIS vos données.</strong> Un partage limité se produit uniquement pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Partenaires de traitement des paiements (routage de transaction chiffré uniquement)</li>
                <li>Autorités de conformité (lorsque légalement requis par CANAFE/réglementations LAB)</li>
                <li>Fournisseurs de services (hébergement cloud, surveillance - sous NDA stricts)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Vos droits (Conformité RGPD & CCPA)</h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Accès :</strong> Demander une copie de vos données personnelles</li>
                <li><strong>Rectification :</strong> Corriger les informations inexactes</li>
                <li><strong>Effacement :</strong> Demander la suppression (sous réserve d'exigences légales de conservation)</li>
                <li><strong>Portabilité :</strong> Exporter vos données dans un format lisible par machine</li>
                <li><strong>Opt-out :</strong> Se désabonner des communications marketing</li>
              </ul>
              <p className="mt-3">Pour exercer ces droits, contactez : <a href="mailto:privacy@ipayx.ai" className="text-cyan-400 hover:underline">privacy@ipayx.ai</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Cookies et suivi</h2>
              <p>Nous utilisons des cookies minimaux pour :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Essentiels :</strong> Gestion de session et authentification (ne peuvent pas être désactivés)</li>
                <li><strong>Analytiques :</strong> Statistiques d'utilisation anonymes pour améliorer l'UX (optionnel)</li>
                <li><strong>Performance :</strong> Mise en cache CDN et équilibrage de charge (nécessité technique)</li>
              </ul>
              <p className="mt-3">Gérez les préférences de cookies via notre bannière de consentement ou sur <a href="/cookies" className="text-cyan-400 hover:underline">/cookies</a></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Conservation des données</h2>
              <p>Nous conservons les données comme suit :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Logs de transaction :</strong> 7 ans (exigence réglementaire)</li>
                <li><strong>Données de compte :</strong> Durée du compte actif + 2 ans</li>
                <li><strong>Logs API :</strong> 90 jours (surveillance de sécurité)</li>
                <li><strong>Données marketing :</strong> Jusqu'à demande de désinscription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Transferts internationaux de données</h2>
              <p>iPAYX opère mondialement. Vos données peuvent être transférées vers :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Canada (juridiction principale - ESM canadien)</li>
                <li>UE (centres de données conformes RGPD)</li>
                <li>États-Unis (infrastructure conforme CCPA)</li>
              </ul>
              <p className="mt-2">Tous les transferts utilisent des Clauses Contractuelles Types (CCT) approuvées par les autorités de l'UE.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Modifications de cette politique</h2>
              <p>Nous pouvons mettre à jour cette Politique de confidentialité périodiquement. Les changements importants seront notifiés via :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Email aux utilisateurs enregistrés (préavis de 30 jours)</li>
                <li>Bannière bien visible sur notre site web</li>
                <li>Date de "Dernière modification" mise à jour en haut de page</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Nous contacter</h2>
              <p>Pour les demandes relatives à la confidentialité :</p>
              <div className="mt-3 space-y-1">
                <p><strong>Email :</strong> <a href="mailto:privacy@ipayx.ai" className="text-cyan-400 hover:underline">privacy@ipayx.ai</a></p>
                <p><strong>Délégué à la protection des données :</strong> <a href="mailto:dpo@ipayx.ai" className="text-cyan-400 hover:underline">dpo@ipayx.ai</a></p>
                <p><strong>Support général :</strong> <a href="mailto:support@ipayx.ai" className="text-cyan-400 hover:underline">support@ipayx.ai</a></p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
