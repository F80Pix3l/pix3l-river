-- Create pipeline_status table for tracking agent progress
CREATE TABLE public.pipeline_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  agent_id INTEGER NOT NULL CHECK (agent_id BETWEEN 1 AND 8),
  status TEXT CHECK (status IN ('pending', 'running', 'done')) DEFAULT 'pending' NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, agent_id)
);

-- Enable Row Level Security
ALTER TABLE public.pipeline_status ENABLE ROW LEVEL SECURITY;

-- Users can view pipeline status for their own videos
CREATE POLICY "Users can view own pipeline status"
  ON public.pipeline_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = pipeline_status.job_id
      AND videos.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_pipeline_status_job_id ON public.pipeline_status(job_id);
CREATE INDEX idx_pipeline_status_agent_id ON public.pipeline_status(agent_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER pipeline_status_updated_at
  BEFORE UPDATE ON public.pipeline_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
