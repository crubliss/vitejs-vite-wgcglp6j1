-- Creator Studio: uploaded media + public player feed
ALTER TABLE videos ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS media_type text;

-- Players need to be able to discover one another's videos. Writes remain owner-only.
DROP POLICY IF EXISTS "owner_select_videos" ON videos;
CREATE POLICY "authenticated_select_all_videos" ON videos
  FOR SELECT TO authenticated USING (true);

-- Public bucket for Creator Studio images/videos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-media', 'creator-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "creator_media_public_read" ON storage.objects;
CREATE POLICY "creator_media_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'creator-media');

DROP POLICY IF EXISTS "creator_media_auth_upload" ON storage.objects;
CREATE POLICY "creator_media_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creator-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "creator_media_owner_update" ON storage.objects;
CREATE POLICY "creator_media_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'creator-media' AND owner_id = auth.uid())
  WITH CHECK (bucket_id = 'creator-media' AND owner_id = auth.uid());

DROP POLICY IF EXISTS "creator_media_owner_delete" ON storage.objects;
CREATE POLICY "creator_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'creator-media' AND owner_id = auth.uid());

-- Bot stats are simulated globally, so authenticated clients may update bot rows.
DROP POLICY IF EXISTS "authenticated_update_bot_videos" ON videos;
CREATE POLICY "authenticated_update_bot_videos" ON videos
  FOR UPDATE TO authenticated
  USING (is_bot = true)
  WITH CHECK (is_bot = true);
