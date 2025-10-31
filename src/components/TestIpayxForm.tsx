import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestIpayxFormProps {
  lang: 'en' | 'fr';
  t: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    ctaButton: string;
    sending: string;
    success: string;
    error: string;
  };
}

export default function TestIpayxForm({ lang, t }: TestIpayxFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation stricte email d'entreprise (bloque domaines grand public)
    const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com', 'live.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!email.includes('@') || !domain || blockedDomains.includes(domain)) {
      toast.error(lang === 'fr' 
        ? "Veuillez utiliser un courriel professionnel (pas Gmail, Yahoo, etc.)" 
        : "Please use a business email (not Gmail, Yahoo, etc.)");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("leads")
        .insert([{ 
          email: email.toLowerCase().trim(), 
          source: "landing-test",
          metadata: {
            language: lang,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }]);

      if (error) throw error;

      toast.success(t.success);
      setEmail("");
    } catch (error: any) {
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-950 via-black to-slate-950 border-y border-slate-900">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          {t.title}
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          {t.subtitle}{' '}
          <a 
            href="https://demo.ipayx.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
          >
            demo.ipayx.com
          </a>
        </p>

        <form 
          onSubmit={handleSubmit} 
          className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto"
        >
          <input
            type="email"
            required
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {isSubmitting ? t.sending : t.ctaButton}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500">
          {lang === 'fr' 
            ? "🔒 Vos données sont sécurisées et ne seront jamais partagées." 
            : "🔒 Your data is secure and will never be shared."}
        </p>
      </div>
    </section>
  );
}
