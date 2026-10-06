/*
# Owner panel: user bans and admin access

1. New Tables
- `owner_config` — stores the owner password hash and other admin settings.
  - `id` int PK (always 1, singleton)
  - `owner_password` text NOT NULL — plaintext password the owner enters (simple gate)
  - `created_at` timestamptz DEFAULT now()
- `user_bans` — records banned users with reason.
  - `id` uuid PK
  - `user_id` uuid NOT NULL — the banned user's auth UID
  - `user_email` text NOT NULL — email at time of ban (for display)
  - `reason` text NOT NULL DEFAULT 'No reason provided'
  - `banned_by` text — who issued the ban
  - `banned_at` timestamptz DEFAULT now()
  - `is_banned` boolean NOT NULL DEFAULT true — false if unbanned
  - UNIQUE(user_id)

2. Functions
- `check_owner_password(input text)` — SECURITY DEFINER. Returns true if the input
  matches the stored owner password. Callable by authenticated users so the panel
  can verify the password without exposing it.
- `list_all_users()` — SECURITY DEFINER. Returns user id, email, created_at, and
  ban status from auth.users LEFT JOINed with user_bans. Only callable by
  authenticated users (the panel is behind a password gate on the frontend).
- `ban_user(target_uuid, reason text)` — SECURITY DEFINER. Inserts or updates a
  ban record for the given user and sets is_banned=true. Returns the ban row.
- `unban_user(target_uuid)` — SECURITY DEFINER. Sets is_banned=false for the
  given user.
- `check_user_banned(target_uuid)` — SECURITY DEFINER. Returns true if the user
  is currently banned. Used at login to block banned users.

3. Security
- Enable RLS on owner_config and user_bans.
- owner_config: NO policies (no one can read/write via anon key — only SECURITY
  DEFINER functions access it).
- user_bans: SELECT only (so the frontend can display ban reasons to banned users).
  All writes go through SECURITY DEFINER functions.
- All functions are SECURITY DEFINER so they can access auth.users and owner_config
  regardless of RLS.
*/

CREATE TABLE IF NOT EXISTS owner_config (
  id int PRIMARY KEY DEFAULT 1,
  owner_password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO owner_config (id, owner_password)
VALUES (1, 'owner2026')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE owner_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_email text NOT NULL,
  reason text NOT NULL DEFAULT 'No reason provided',
  banned_by text,
  banned_at timestamptz DEFAULT now(),
  is_banned boolean NOT NULL DEFAULT true
);

ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_ban" ON user_bans;
CREATE POLICY "read_own_ban" ON user_bans FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS check_owner_password(text);
DROP FUNCTION IF EXISTS list_all_users();
DROP FUNCTION IF EXISTS ban_user(uuid, text);
DROP FUNCTION IF EXISTS unban_user(uuid);
DROP FUNCTION IF EXISTS check_user_banned(uuid);

-- Check owner password
CREATE OR REPLACE FUNCTION check_owner_password(input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM owner_config WHERE owner_password = input
  );
END;
$$;

-- List all users with ban status
CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  is_banned boolean,
  ban_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    COALESCE(b.is_banned, false) AS is_banned,
    b.reason AS ban_reason
  FROM auth.users u
  LEFT JOIN user_bans b ON b.user_id = u.id;
END;
$$;

-- Ban a user
CREATE OR REPLACE FUNCTION ban_user(target_uid uuid, ban_reason text)
RETURNS user_bans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result user_bans;
  target_email text;
BEGIN
  SELECT email INTO target_email FROM auth.users WHERE id = target_uid;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO user_bans (user_id, user_email, reason, is_banned)
  VALUES (target_uid, target_email, ban_reason, true)
  ON CONFLICT (user_id) DO UPDATE
    SET reason = ban_reason, is_banned = true, banned_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Unban a user
CREATE OR REPLACE FUNCTION unban_user(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_bans SET is_banned = false WHERE user_id = target_uid;
END;
$$;

-- Check if a user is banned (for login check)
CREATE OR REPLACE FUNCTION check_user_banned(target_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_bans WHERE user_id = target_uid AND is_banned = true
  );
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION check_owner_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION ban_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unban_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_banned(uuid) TO authenticated;
