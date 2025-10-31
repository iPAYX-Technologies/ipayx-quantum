-- Create campaigns table for email marketing automation
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('welcome', 'followup_1', 'followup_2', 'demo', 'case_study', 'urgent')),
  video_url TEXT,
  video_script TEXT,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sendgrid_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC(10,2),
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'converted')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage campaigns"
ON public.campaigns
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Policy: Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage campaigns"
ON public.campaigns
FOR ALL
USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER handle_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_campaigns_lead_id ON public.campaigns(lead_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_sent_at ON public.campaigns(sent_at DESC);
CREATE INDEX idx_campaigns_campaign_type ON public.campaigns(campaign_type);

-- Add campaign tracking to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_campaign_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS campaigns_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE public.campaigns IS 'Email marketing campaigns with HeyGen videos and SendGrid tracking';
COMMENT ON COLUMN public.campaigns.sendgrid_message_id IS 'SendGrid message ID for webhook tracking';
COMMENT ON COLUMN public.campaigns.video_url IS 'HeyGen video URL embedded in email';
COMMENT ON COLUMN public.campaigns.conversion_value IS 'Deal value if lead converts to customer';