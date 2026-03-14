-- Create generated_content table for AI-generated platform content
CREATE TABLE public.generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'tiktok', 'instagram')) NOT NULL,
  title TEXT,
  description TEXT,
  hashtags TEXT[],
  thumbnail_url TEXT,
  scheduled_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'edited')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, platform)
);

-- Enable Row Level Security
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

-- Users can view generated content for their own videos
CREATE POLICY "Users can view own generated content"
  ON public.generated_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = generated_content.job_id
      AND videos.user_id = auth.uid()
    )
  );

-- Users can update generated content for their own videos
CREATE POLICY "Users can update own generated content"
  ON public.generated_content
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = generated_content.job_id
      AND videos.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_generated_content_job_id ON public.generated_content(job_id);
CREATE INDEX idx_generated_content_platform ON public.generated_content(platform);

-- Trigger to auto-update updated_at
CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON public.generated_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
