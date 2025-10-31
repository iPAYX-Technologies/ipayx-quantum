import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Configuration via environment variables
const MODE = Deno.env.get("IPAYX_PROXY_MODE") ?? "github";
const OWNER = Deno.env.get("IPAYX_META_ROUTE_OWNER") ?? "iPAYX-Technologies";
const REPO = Deno.env.get("IPAYX_META_ROUTE_REPO") ?? "Ipayx-protocol";
const BRANCH = Deno.env.get("IPAYX_META_ROUTE_BRANCH") ?? "main";
const PYTHON_BACKEND_URL = Deno.env.get("IPAYX_PYTHON_BACKEND_URL") ?? "";

// Path mapping for meta-router endpoints
function mapPath(pathname: string): string {
  // Map /meta-router to /src/data/rails.json
  if (/^\/meta-router(\/|$)/.test(pathname)) {
    return "/src/data/rails.json";
  }
  // Ensure path always starts with /
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let url: string;
    let data: string;

    if (MODE === "python" && PYTHON_BACKEND_URL) {
      // Mode Python: Proxy vers le backend Python
      url = `${PYTHON_BACKEND_URL}${endpoint}`;
      console.log(`[proxy-github:python] → GET ${url}`);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.error(`❌ Python backend fetch failed — status: ${res.status}`);
        return new Response(
          JSON.stringify({ error: `Backend fetch failed: ${res.status}` }), 
          { 
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      data = await res.text();
      console.log(`✅ Python backend fetch OK — status: ${res.status}, length: ${data.length}`);
      
    } else {
      // Mode GitHub: Fetch depuis GitHub raw content
      const mappedPath = mapPath(endpoint);
      url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}${mappedPath}`;
      console.log(`[proxy-github:github] → GET ${url}`);
      
      const res = await fetch(url);

      if (!res.ok) {
        console.error(`❌ GitHub fetch failed — status: ${res.status}`);
        return new Response(
          JSON.stringify({ error: `GitHub fetch failed: ${res.status}` }), 
          { 
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ GitHub fetch OK — status: ${res.status}, content-type: ${res.headers.get('content-type')}`);
      
      data = await res.text();
      console.log(`📦 Content length: ${data.length} characters`);
      console.log(`📄 Preview: ${data.substring(0, 100)}`);
    }
    
    console.log("✅ Proxy actif et fonctionnel");
    
    // Phase 4: Add CDN caching to reduce GitHub API calls
    return new Response(
      JSON.stringify({ content: data }), 
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300' // 5 min cache
        },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('Proxy error:', err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
