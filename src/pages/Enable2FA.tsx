import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import QRCode from 'react-qr-code';

export default function Enable2FA() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = () => {
    // Generate a random base32 secret (simplified for demo)
    const secret = Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
    setSecret(secret);

    // Generate 6 backup codes
    const codes = Array.from({ length: 6 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
  };

  const getQRCodeValue = () => {
    const issuer = 'iPayX Protocol';
    const label = user?.email || 'user';
    return `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // Server-side verification of TOTP code
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-2fa', {
        body: { secret, code: verificationCode }
      });

      if (verifyError) {
        throw new Error('Verification failed: ' + verifyError.message);
      }

      if (!verifyResult?.valid) {
        toast.error('Invalid verification code. Please try again.');
        setLoading(false);
        return;
      }

      // Code is valid, save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: backupCodes
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: '2fa_enabled',
        user_agent: navigator.userAgent
      });

      setStep('complete');
      toast.success('2FA enabled successfully');
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">
                Enable Two-Factor Authentication
              </CardTitle>
            </div>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'setup' && (
              <>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                    <QRCode value={getQRCodeValue()} size={200} />
                    <p className="text-sm text-center text-muted-foreground">
                      Scan this QR code with Google Authenticator or Authy
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Or enter this key manually:</Label>
                    <div className="flex gap-2">
                      <Input value={secret} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copySecret}
                      >
                        {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Backup Codes</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Save these codes in a secure place. Each can be used once if you lose access to your authenticator.
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, i) => (
                        <div key={i} className="bg-background p-2 rounded border">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={() => setStep('verify')} className="w-full">
                  Continue
                </Button>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Enter the 6-digit code from your authenticator app
                    </Label>
                    <Input
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleVerify} disabled={loading || verificationCode.length !== 6} className="flex-1">
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                </div>
              </>
            )}

            {step === 'complete' && (
              <>
                <div className="text-center space-y-4 py-6">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                      <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-muted-foreground">
                    Your account is now protected with 2FA
                  </p>
                </div>

                <Button onClick={() => navigate('/profile')} className="w-full">
                  Return to Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
