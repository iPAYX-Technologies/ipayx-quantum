import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import countries from "@/data/countries.json";

interface SmartContactFormProps {
  lang: 'en' | 'fr';
  t: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    company: string;
    country: string;
    monthlyVolume: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    emailPlaceholder: string;
    namePlaceholder: string;
    companyPlaceholder: string;
    messagePlaceholder: string;
    selectCountry: string;
    selectVolume: string;
  };
}

const VOLUME_OPTIONS = [
  { value: "$0-100k", labelEn: "$0 - 100k/month", labelFr: "0$ - 100k$/mois" },
  { value: "$100k-500k", labelEn: "$100k - 500k/month", labelFr: "100k$ - 500k$/mois" },
  { value: "$500k-1M", labelEn: "$500k - 1M/month", labelFr: "500k$ - 1M$/mois" },
  { value: "$1M-5M", labelEn: "$1M - 5M/month", labelFr: "1M$ - 5M$/mois" },
  { value: "$5M+", labelEn: "$5M+/month", labelFr: "5M$+/mois" },
];

export default function SmartContactForm({ lang, t }: SmartContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    country: "",
    monthlyVolume: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation stricte email d'entreprise
    const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com', 'live.com'];
    const domain = formData.email.split('@')[1]?.toLowerCase();
    
    if (!formData.email.includes('@') || !domain || blockedDomains.includes(domain)) {
      toast.error(lang === 'fr' 
        ? "Veuillez utiliser un courriel professionnel (pas Gmail, Yahoo, etc.)" 
        : "Please use a business email (not Gmail, Yahoo, etc.)");
      return;
    }

    if (formData.message.length < 50) {
      toast.error(lang === 'fr'
        ? "Veuillez décrire votre besoin en au moins 50 caractères"
        : "Please describe your needs in at least 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          country: formData.country,
          monthlyVolume: formData.monthlyVolume,
          message: formData.message,
          language: lang
        }
      });

      if (error) {
        throw new Error(error.message || 'Form submission failed');
      }

      if (!data?.success) {
        throw new Error('Form submission failed');
      }

      toast.success(t.success);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        country: "",
        monthlyVolume: "",
        message: ""
      });

    } catch (error: any) {
      console.error("❌ Form submission error:", error);
      toast.error(t.error + (error.message ? `: ${error.message}` : ''));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-950 via-black to-slate-950 border-y border-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            {t.title}
          </h2>
          <p className="text-gray-400 text-lg">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">{t.name}</Label>
            <Input
              id="name"
              type="text"
              required
              placeholder={t.namePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">{t.email}</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder={t.emailPlaceholder}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-gray-300">{t.company}</Label>
            <Input
              id="company"
              type="text"
              required
              placeholder={t.companyPlaceholder}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={isSubmitting}
              className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>

          {/* Country and Volume - Side by side on desktop */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-gray-300">{t.country}</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20">
                  <SelectValue placeholder={t.selectCountry} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 max-h-[300px]">
                  {countries.map((country) => (
                    <SelectItem 
                      key={country.code} 
                      value={country.name}
                      className="text-white hover:bg-slate-800 focus:bg-slate-800"
                    >
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Volume */}
            <div className="space-y-2">
              <Label htmlFor="volume" className="text-gray-300">{t.monthlyVolume}</Label>
              <Select
                value={formData.monthlyVolume}
                onValueChange={(value) => setFormData({ ...formData, monthlyVolume: value })}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20">
                  <SelectValue placeholder={t.selectVolume} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {VOLUME_OPTIONS.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white hover:bg-slate-800 focus:bg-slate-800"
                    >
                      {lang === 'fr' ? option.labelFr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">{t.message}</Label>
            <Textarea
              id="message"
              required
              placeholder={t.messagePlaceholder}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              disabled={isSubmitting}
              rows={5}
              maxLength={500}
              className="bg-slate-900 text-white border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.message.length}/500 {lang === 'fr' ? 'caractères' : 'characters'}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t.sending}
              </>
            ) : (
              t.submit
            )}
          </Button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            {lang === 'fr' 
              ? "🔒 Vos données sont sécurisées et ne seront jamais partagées. Nous analysons votre demande avec notre IA pour vous répondre rapidement." 
              : "🔒 Your data is secure and will never be shared. We analyze your request with our AI to respond quickly."}
          </p>
        </form>
      </div>
    </section>
  );
}
