-- Create transcripts table for storing video transcriptions
CREATE TABLE public.transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  language TEXT,
  duration_seconds REAL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Users can view transcripts for their own videos
CREATE POLICY "Users can view own transcripts"
  ON public.transcripts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = transcripts.job_id
      AND videos.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_transcripts_job_id ON public.transcripts(job_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
