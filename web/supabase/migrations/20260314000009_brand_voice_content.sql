-- Brand voice refined content (separate from generated_content)
CREATE TABLE public.brand_voice_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  platform TEXT CHECK (platform IN ('youtube', 'tiktok', 'instagram')) NOT NULL,
  title TEXT,
  description TEXT,
  hashtags TEXT[],
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'edited')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, platform)
);

ALTER TABLE public.brand_voice_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand voice content"
  ON public.brand_voice_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = brand_voice_content.job_id
      AND videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own brand voice content"
  ON public.brand_voice_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = brand_voice_content.job_id
      AND videos.user_id = auth.uid()
    )
  );

CREATE INDEX idx_brand_voice_content_job_id ON public.brand_voice_content(job_id);

CREATE TRIGGER brand_voice_content_updated_at
  BEFORE UPDATE ON public.brand_voice_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
