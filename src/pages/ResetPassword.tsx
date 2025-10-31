import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔄 Envoi email de réinitialisation à:', email);

    try {
      // Use custom edge function with SendGrid for better deliverability
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel de la fonction:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Échec de l\'envoi de l\'email');
      }

      console.log('✅ Email envoyé avec succès');
      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé!');
    } catch (error: any) {
      console.error('💥 Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500/10 via-background to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Mot de passe oublié?</CardTitle>
            </div>
            <CardDescription>
              {emailSent 
                ? "Vérifiez votre boîte de réception"
                : "Entrez votre email pour recevoir un lien de réinitialisation"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg space-y-3">
                  <p className="text-sm text-center font-medium">
                    ✅ Email envoyé avec succès!
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    Nous avons envoyé un lien à:<br />
                    <strong className="text-foreground">{email}</strong>
                  </p>
                  <div className="pt-2 border-t border-cyan-500/20">
                    <p className="text-xs text-center text-muted-foreground">
                      💡 Vérifiez aussi votre dossier spam/courrier indésirable
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                >
                  Renvoyer l'email
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 iPayX - Pure couche de routage
          </p>
        </div>
      </div>
    </div>
  );
}