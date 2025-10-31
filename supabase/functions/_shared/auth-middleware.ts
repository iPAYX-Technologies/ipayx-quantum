import { createClient } from 'npm:@supabase/supabase-js@2';

export async function validateApiKey(
  apiKey: string, 
  requiredScopes: string[]
): Promise<{ valid: boolean; userId?: string; projectId?: string; error?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Vérifier clé
  const { data: key, error } = await supabase
    .from('api_keys')
    .select('*, projects(id, org_id)')
    .eq('key', apiKey)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !key) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Vérifier scopes
  const hasScopes = requiredScopes.every(scope => 
    key.scopes?.includes(scope)
  );

  if (!hasScopes) {
    return { valid: false, error: `Insufficient scopes. Required: ${requiredScopes.join(', ')}` };
  }

  // Update last_used
  await supabase
    .from('api_keys')
    .update({ 
      last_used_at: new Date().toISOString(), 
      usage_count: (key.usage_count || 0) + 1 
    })
    .eq('id', key.id);

  return { 
    valid: true, 
    userId: key.email, 
    projectId: key.projects?.id 
  };
}
