import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINTRAC_THRESHOLD_CAD = 10000;

// Helper function to escape XML special characters
function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Build FINTRAC ECTR XML
function buildFintracEctrXml(
  senderId: string,
  amountCad: number,
  receiverCountry: string,
  kyc: { sender_name: string; address: string; dob: string },
  addComment?: string
): string {
  const today = new Date().toISOString().slice(0, 10);
  const comment = addComment ? `  <!-- ${xmlEscape(addComment)} -->\n` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<ECTR>
${comment}  <TransactionDate>${today}</TransactionDate>
  <Amount>${amountCad}</Amount>
  <SenderName>${xmlEscape(kyc.sender_name || "")}</SenderName>
  <SenderID>${xmlEscape(senderId)}</SenderID>
  <SenderAddress>${xmlEscape(kyc.address || "")}</SenderAddress>
  <SenderDOB>${xmlEscape(kyc.dob || "")}</SenderDOB>
  <ReceiverCountry>${xmlEscape(receiverCountry)}</ReceiverCountry>
</ECTR>
`;
}

// Generate safe filename
function safeFileName(senderId: string): string {
  return String(senderId || "sender").replace(/[^a-zA-Z0-9_.-]/g, "_");
}

// Save FINTRAC file (in-memory for Supabase Edge Functions)
function generateFintracFileName(senderId: string): string {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `ectr_report_${safeFileName(senderId)}_${timestamp}.xml`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { senderId, amountCad, receiverCountry, kyc, force } = body;

    // Validate required fields
    if (!senderId || amountCad === undefined || !receiverCountry || !kyc) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: senderId, amountCad, receiverCountry, kyc' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate KYC fields
    if (!kyc.sender_name || !kyc.address || !kyc.dob) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required KYC fields: sender_name, address, dob' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check threshold
    if (!force && amountCad < FINTRAC_THRESHOLD_CAD) {
      return new Response(
        JSON.stringify({ 
          generated: false,
          reason: 'below_threshold',
          threshold: FINTRAC_THRESHOLD_CAD,
          amountCad,
          message: `Amount ${amountCad} CAD is below the FINTRAC reporting threshold of ${FINTRAC_THRESHOLD_CAD} CAD`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get DRY_RUN setting from environment (default to true)
    const dryRun = (Deno.env.get('DRY_RUN') ?? 'true').toLowerCase() !== 'false';
    
    // Generate XML
    const xml = buildFintracEctrXml(
      senderId,
      amountCad,
      receiverCountry,
      kyc,
      dryRun ? "DRY_RUN — not submitted" : undefined
    );

    // Generate file metadata (we don't actually write to filesystem in serverless)
    const fileName = generateFintracFileName(senderId);
    const filePath = `/tmp/fintrac/${fileName}`;

    // Truncate preview if too long
    const xmlPreview = xml.length > 2000 ? xml.slice(0, 2000) + '...[truncated]' : xml;

    return new Response(
      JSON.stringify({
        generated: true,
        dryRun,
        file: {
          fileName,
          path: filePath,
          sizeBytes: xml.length,
        },
        xmlPreview,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FINTRAC compliance error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
