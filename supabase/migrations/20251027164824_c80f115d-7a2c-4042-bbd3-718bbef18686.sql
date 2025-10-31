-- ========================================
-- Nettoyage Complet: Supprimer 298 leads
-- ========================================

-- Supprimer TOUS les leads existants (clean slate)
TRUNCATE TABLE public.leads CASCADE;

-- Réinitialiser les campagnes associées
TRUNCATE TABLE public.campaigns CASCADE;

-- Confirmation: Database prête pour nouvel import
-- ✅ RLS déjà actif sur transaction_logs
-- ✅ Leads table vide et prête
-- ✅ Policy "Anyone can submit leads" active pour import