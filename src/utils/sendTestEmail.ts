import { supabase } from "@/integrations/supabase/client";

export async function sendTestEmail() {
  console.log('🧪 Triggering test email to ybolduc@ipayx.ai...');
  
  try {
    const { data, error } = await supabase.functions.invoke('test-email', {
      body: {}
    });

    if (error) {
      console.error('❌ Test email failed:', error);
      throw error;
    }

    console.log('✅ Test email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 Error invoking test-email function:', error);
    throw error;
  }
}
