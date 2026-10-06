/*
# Fix list_all_users return type mismatch

The auth.users.email column is varchar(255), but list_all_users() declared
its return type as text. PostgreSQL throws a "structure of query does not
match function result type" error. Fix by casting email to text in the query.
*/

DROP FUNCTION IF EXISTS list_all_users();

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
    u.email::text,
    u.created_at,
    COALESCE(b.is_banned, false) AS is_banned,
    b.reason::text AS ban_reason
  FROM auth.users u
  LEFT JOIN user_bans b ON b.user_id = u.id;
END;
$$;

GRANT EXECUTE ON FUNCTION list_all_users() TO authenticated;
