
-- Add video tracking columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS heygen_video_id TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_video_status ON campaigns(video_status);

-- Add comment for documentation
COMMENT ON COLUMN campaigns.video_status IS 'Status of HeyGen video generation: pending, processing, completed, failed';
COMMENT ON COLUMN campaigns.heygen_video_id IS 'HeyGen video ID for tracking and status checks';
COMMENT ON COLUMN campaigns.error_message IS 'Error message if video generation or email sending failed';
