-- Enable realtime for campaigns table

-- Set REPLICA IDENTITY to FULL to capture all column values during updates
ALTER TABLE public.campaigns REPLICA IDENTITY FULL;

-- Add campaigns table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;