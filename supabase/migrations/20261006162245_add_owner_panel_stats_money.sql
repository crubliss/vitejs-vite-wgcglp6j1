/*
# Owner panel: user stats and money management

1. New Functions
- `get_user_stats(target_uid uuid)` — SECURITY DEFINER. Returns a single row
  with the target user's email, wallet balance, game count, total wagered,
  total payout, car count, drug count, active investments, and trade count.
- `set_user_balance(target_uid uuid, new_balance numeric)` — SECURITY DEFINER.
  Sets the target user's wallet balance to an exact amount. Returns the new balance.
- `add_user_balance(target_uid uuid, amount numeric)` — SECURITY DEFINER.
  Adds (or subtracts if negative) from the target user's wallet balance.
  Returns the new balance.

2. Security
- All functions are SECURITY DEFINER so they can access wallet and other tables
  owned by different users. Only callable by authenticated users (the panel is
  behind a password gate).
- No new tables needed — operates on existing wallet and stats tables.
*/

DROP FUNCTION IF EXISTS get_user_stats(uuid);
DROP FUNCTION IF EXISTS set_user_balance(uuid, numeric);
DROP FUNCTION IF EXISTS add_user_balance(uuid, numeric);

CREATE OR REPLACE FUNCTION get_user_stats(target_uid uuid)
RETURNS TABLE (
  email text,
  balance numeric,
  game_count bigint,
  total_wagered numeric,
  total_payout numeric,
  car_count bigint,
  drug_count bigint,
  active_investments bigint,
  trade_count bigint,
  video_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email::text,
    COALESCE(w.balance, 0)::numeric AS balance,
    COALESCE(gh.cnt, 0) AS game_count,
    COALESCE(gh.wagered, 0)::numeric AS total_wagered,
    COALESCE(gh.payout, 0)::numeric AS total_payout,
    COALESCE(oc.cnt, 0) AS car_count,
    COALESCE(di.cnt, 0) AS drug_count,
    COALESCE(inv.cnt, 0) AS active_investments,
    COALESCE(tr.cnt, 0) AS trade_count,
    COALESCE(vid.cnt, 0) AS video_count
  FROM auth.users u
  LEFT JOIN wallet w ON w.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt, sum(bet_amount) AS wagered, sum(payout) AS payoutpayout FROM game_history GROUP BY user_id) gh ON gh.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM owned_cars GROUP BY user_id) oc ON oc.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM drug_inventory GROUP BY user_id) di ON di.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM investments WHERE status = 'active' GROUP BY user_id) inv ON inv.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM trades GROUP BY user_id) tr ON tr.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM videos GROUP BY user_id) vid ON vid.user_id = u.id
  WHERE u.id = target_uid;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_balance(target_uid uuid, new_balance numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result numeric;
BEGIN
  UPDATE wallet SET balance = new_balance, updated_at = now() WHERE user_id = target_uid
  RETURNING balance INTO result;
  IF result IS NULL THEN
    -- wallet doesn't exist, create one
    INSERT INTO wallet (user_id, balance) VALUES (target_uid, new_balance)
    RETURNING balance INTO result;
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION add_user_balance(target_uid uuid, amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result numeric;
BEGIN
  UPDATE wallet SET balance = balance + amount, updated_at = now() WHERE user_id = target_uid
  RETURNING balance INTO result;
  IF result IS NULL THEN
    INSERT INTO wallet (user_id, balance) VALUES (target_uid, amount)
    RETURNING balance INTO result;
  END IF;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_balance(uuid, numeric) TO authenticated;
