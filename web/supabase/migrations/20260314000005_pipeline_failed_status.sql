-- Add 'failed' as a valid status for pipeline_status
ALTER TABLE public.pipeline_status
  DROP CONSTRAINT IF EXISTS pipeline_status_status_check;

ALTER TABLE public.pipeline_status
  ADD CONSTRAINT pipeline_status_status_check
  CHECK (status IN ('pending', 'running', 'done', 'failed'));
