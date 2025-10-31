-- Fonction trigger pour notifier automatiquement les admins lors d'un nouveau lead
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- Construire l'URL complète de la fonction
  function_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
  IF function_url IS NULL THEN
    function_url := 'https://ggkymbeyesuodnoogzyb.supabase.co';
  ELSE
    function_url := 'https://' || function_url;
  END IF;
  
  -- Appeler l'edge function de notification de manière asynchrone
  PERFORM net.http_post(
    url := function_url || '/functions/v1/submit-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('request.headers', true)::json->>'apikey'
    ),
    body := jsonb_build_object(
      'name', NEW.name,
      'email', NEW.email,
      'company', COALESCE(NEW.company, ''),
      'country', COALESCE(NEW.country, ''),
      'monthlyVolume', COALESCE(NEW.monthly_volume, ''),
      'message', COALESCE(NEW.message, ''),
      'language', 'en',
      'source', 'database-trigger'
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer l'insertion si la notification échoue
    RAISE WARNING 'Lead notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table leads
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_lead();

-- Fonction trigger pour notifier automatiquement les admins lors d'une nouvelle inscription
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- Construire l'URL complète de la fonction
  function_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
  IF function_url IS NULL THEN
    function_url := 'https://ggkymbeyesuodnoogzyb.supabase.co';
  ELSE
    function_url := 'https://' || function_url;
  END IF;
  
  -- Appeler l'edge function de notification
  PERFORM net.http_post(
    url := function_url || '/functions/v1/notify-new-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('request.headers', true)::json->>'apikey'
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'company', COALESCE(NEW.company, ''),
      'country', COALESCE(NEW.country, ''),
      'partner_id', NEW.partner_id,
      'created_at', NEW.created_at::text
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Signup notification trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table profiles
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_signup();

-- Activer realtime pour la table leads (pour le dashboard admin)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;