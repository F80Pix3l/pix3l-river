-- Allow users to delete thumbnail files they own (via video ownership)
CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = 'thumbnails' AND
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id::text = (storage.foldername(name))[2]
      AND videos.user_id = auth.uid()
    )
  );
