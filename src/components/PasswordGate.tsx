import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD;

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if already unlocked in session
    const unlocked = sessionStorage.getItem('site_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem('site_unlocked', 'true');
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // If no password configured or already unlocked, show content
  if (!SITE_PASSWORD || isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500/10 via-background to-background p-4">
      <Card className="w-full max-w-md border-cyan-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold">Private Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            This site is currently in private mode
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter site password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-red-500' : ''}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">Invalid password. Please try again.</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Unlock Site
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
