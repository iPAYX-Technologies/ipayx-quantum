-- Fix #1: Corriger le bug RLS Organizations
-- La policy actuelle a org_members.org_id = org_members.id au lieu de = organizations.id

DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;

CREATE POLICY "Users can view their own organizations"
  ON public.organizations
  FOR SELECT
  USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
    )
  );