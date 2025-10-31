import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { company?: string; country?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        } else if (event === 'USER_UPDATED') {
          toast.success('Profile updated');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { company?: string; country?: string }) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Block public email providers only - allow all professional domains
      const domain = email.split('@')[1]?.toLowerCase();
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'protonmail.com'];
      
      if (!domain || publicDomains.includes(domain)) {
        toast.error('Utilisez un email professionnel (pas Gmail, Yahoo, Outlook, etc.)');
        return { error: { message: 'Public email addresses are not allowed' } };
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata || {}
        }
      });

      if (error) {
        // Traduire les erreurs en français avec messages plus clairs
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered') || error.message.includes('already registered')) {
          errorMessage = '❌ Cet email est déjà utilisé. Essayez de vous connecter.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '❌ Adresse email invalide';
        } else if (error.message.includes('Password') || error.message.includes('password')) {
          errorMessage = '❌ Mot de passe trop faible (minimum 6 caractères requis)';
        } else if (error.message.includes('Database error') || error.message.includes('violates')) {
          errorMessage = '❌ Erreur serveur. Votre compte est créé mais nous rencontrons un problème technique. Contactez le support.';
        }
        
        toast.error(errorMessage);
        return { error };
      }

      // Notify admins about new signup
      try {
        await supabase.functions.invoke('notify-new-signup', {
          body: {
            email,
            company: metadata?.company || '',
            country: metadata?.country || '',
            partner_id: '',
            created_at: new Date().toISOString()
          }
        });
      } catch (notifyError) {
        // Don't fail signup if notification fails
        console.error('Failed to send notification:', notifyError);
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('welcome-email', {
          body: {
            email,
            name: metadata?.company || email.split('@')[0]
          }
        });
      } catch (emailError) {
        // Don't fail signup if welcome email fails
        console.error('Failed to send welcome email:', emailError);
      }

      toast.success('Account created! Please check your email to confirm.');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Traduire les erreurs de connexion en français
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials') || error.message.includes('credentials')) {
          errorMessage = '❌ Email ou mot de passe incorrect';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '❌ Veuillez confirmer votre email avant de vous connecter';
        }
        
        toast.error(errorMessage);
        return { error };
      }

      navigate('/dashboard');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        // Traduire les erreurs courantes
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'Cet email est déjà utilisé. Essayez de vous connecter ou réinitialisez votre mot de passe.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Adresse email invalide.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Mot de passe trop faible. Utilisez au moins 6 caractères.';
        } else if (error.message.includes('Database error')) {
          errorMessage = 'Erreur serveur lors de la création du compte. Veuillez réessayer.';
        }
        
        toast.error(errorMessage);
        return { error };
      }

      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
