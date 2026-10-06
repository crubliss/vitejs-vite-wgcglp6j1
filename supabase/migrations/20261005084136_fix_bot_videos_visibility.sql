/*
# Make bot videos visible to all authenticated users

Bot videos (is_bot = true) in the videos table are a shared "Discover" feed
that all users should see. Currently, owner-scoped RLS means each user only
sees their own rows. This adds a SELECT policy allowing all authenticated
users to see bot videos, while keeping user videos owner-scoped.

## Changes
- New SELECT policy: any authenticated user can SELECT videos where is_bot = true
- Existing owner SELECT policy remains for user-created videos
*/

DROP POLICY IF EXISTS "owner_select_videos" ON videos;
DROP POLICY IF EXISTS "public_select_bot_videos" ON videos;

-- Owner can see their own videos (non-bot)
CREATE POLICY "owner_select_videos" ON videos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- All authenticated users can see bot videos (shared discover feed)
CREATE POLICY "public_select_bot_videos" ON videos FOR SELECT
TO authenticated
USING (is_bot = true);
