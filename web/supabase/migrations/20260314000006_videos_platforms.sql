-- Add platforms column to videos table to track which platforms were selected at upload
ALTER TABLE public.videos
  ADD COLUMN platforms TEXT[] DEFAULT ARRAY['youtube', 'tiktok', 'instagram'] NOT NULL;
