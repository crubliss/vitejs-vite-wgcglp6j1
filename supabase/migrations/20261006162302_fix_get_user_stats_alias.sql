/*
# Fix get_user_stats: correct alias name

The subquery aliased sum(payout) as "payoutpayout" instead of "payout",
causing a "column gh.payout does not exist" error. Fixed the alias.
*/

DROP FUNCTION IF EXISTS get_user_stats(uuid);

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
    COALESCE(gh.payout_sum, 0)::numeric AS total_payout,
    COALESCE(oc.cnt, 0) AS car_count,
    COALESCE(di.cnt, 0) AS drug_count,
    COALESCE(inv.cnt, 0) AS active_investments,
    COALESCE(tr.cnt, 0) AS trade_count,
    COALESCE(vid.cnt, 0) AS video_count
  FROM auth.users u
  LEFT JOIN wallet w ON w.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt, COALESCE(sum(bet_amount), 0) AS wagered, COALESCE(sum(payout), 0) AS payout_sum FROM game_history GROUP BY user_id) gh ON gh.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM owned_cars GROUP BY user_id) oc ON oc.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM drug_inventory GROUP BY user_id) di ON di.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM investments WHERE status = 'active' GROUP BY user_id) inv ON inv.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM trades GROUP BY user_id) tr ON tr.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM videos GROUP BY user_id) vid ON vid.user_id = u.id
  WHERE u.id = target_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_stats(uuid) TO authenticated;
