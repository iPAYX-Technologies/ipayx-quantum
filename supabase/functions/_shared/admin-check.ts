import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Require admin role for protected edge functions
 * Returns userId if authorized, Response object if unauthorized
 */
export async function requireAdmin(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (roleError || !role) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return user.id;
}
