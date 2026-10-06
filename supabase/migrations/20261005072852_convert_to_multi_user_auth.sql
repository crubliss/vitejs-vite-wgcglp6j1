/*
# Convert single-tenant schema to multi-user (auth-based) schema

## Overview
This migration adds a `user_id` column to every data table and switches all
RLS policies from public (anon + authenticated) to owner-scoped
(authenticated only, auth.uid() = user_id). This ensures each user only sees
their own wallet, holdings, trades, cars, videos, guns, etc.

## Important Notes
1. Existing rows get user_id = NULL and become invisible to all users.
   This is intentional — the app is switching from shared data to per-user data.
2. New rows automatically get user_id = auth.uid() via DEFAULT.
3. The wallet table's primary key is changed from id=1 to a sequence so
   each user can have their own wallet row.
4. All policies changed from TO anon, authenticated USING (true) to
   TO authenticated USING (auth.uid() = user_id).

## Tables Modified
- wallet: drop old PK/check, add user_id, add unique(user_id)
- holdings: add user_id
- trades: add user_id
- game_history: add user_id
- owned_cars: add user_id
- investments: add user_id
- videos: add user_id
- backroom_builds: add user_id
- market_inventory: add user_id
- car_offers: add user_id
- guns: add user_id
- range_scores: add user_id

## Security
- All tables: RLS stays enabled.
- All policies: TO authenticated, ownership check auth.uid() = user_id.
- SELECT: USING (auth.uid() = user_id)
- INSERT: WITH CHECK (auth.uid() = user_id)
- UPDATE: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
- DELETE: USING (auth.uid() = user_id)
*/

-- ── wallet ──
CREATE SEQUENCE IF NOT EXISTS wallet_id_seq;
ALTER TABLE wallet DROP CONSTRAINT IF EXISTS wallet_pkey;
ALTER TABLE wallet DROP CONSTRAINT IF EXISTS wallet_single_row;
ALTER TABLE wallet ALTER COLUMN id SET DEFAULT nextval('wallet_id_seq');
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE wallet ADD CONSTRAINT wallet_user_unique UNIQUE (user_id);

DROP POLICY IF EXISTS "anon_select_wallet" ON wallet;
DROP POLICY IF EXISTS "anon_insert_wallet" ON wallet;
DROP POLICY IF EXISTS "anon_update_wallet" ON wallet;
DROP POLICY IF EXISTS "anon_delete_wallet" ON wallet;
CREATE POLICY "owner_select_wallet" ON wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_wallet" ON wallet FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_wallet" ON wallet FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_wallet" ON wallet FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── holdings ──
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_holdings" ON holdings;
DROP POLICY IF EXISTS "anon_insert_holdings" ON holdings;
DROP POLICY IF EXISTS "anon_update_holdings" ON holdings;
DROP POLICY IF EXISTS "anon_delete_holdings" ON holdings;
CREATE POLICY "owner_select_holdings" ON holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_holdings" ON holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_holdings" ON holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_holdings" ON holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── trades ──
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_trades" ON trades;
DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
DROP POLICY IF EXISTS "anon_update_trades" ON trades;
DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "owner_select_trades" ON trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_trades" ON trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_trades" ON trades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_trades" ON trades FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── game_history ──
ALTER TABLE game_history ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_game_history" ON game_history;
DROP POLICY IF EXISTS "anon_insert_game_history" ON game_history;
DROP POLICY IF EXISTS "anon_update_game_history" ON game_history;
DROP POLICY IF EXISTS "anon_delete_game_history" ON game_history;
CREATE POLICY "owner_select_game_history" ON game_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_game_history" ON game_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_game_history" ON game_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_game_history" ON game_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── owned_cars ──
ALTER TABLE owned_cars ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_owned_cars" ON owned_cars;
DROP POLICY IF EXISTS "anon_insert_owned_cars" ON owned_cars;
DROP POLICY IF EXISTS "anon_update_owned_cars" ON owned_cars;
DROP POLICY IF EXISTS "anon_delete_owned_cars" ON owned_cars;
CREATE POLICY "owner_select_owned_cars" ON owned_cars FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_owned_cars" ON owned_cars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_owned_cars" ON owned_cars FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_owned_cars" ON owned_cars FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── investments ──
ALTER TABLE investments ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_investments" ON investments;
DROP POLICY IF EXISTS "anon_insert_investments" ON investments;
DROP POLICY IF EXISTS "anon_update_investments" ON investments;
DROP POLICY IF EXISTS "anon_delete_investments" ON investments;
CREATE POLICY "owner_select_investments" ON investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_investments" ON investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_investments" ON investments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_investments" ON investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── videos ──
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_videos" ON videos;
DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
DROP POLICY IF EXISTS "anon_update_videos" ON videos;
DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "owner_select_videos" ON videos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_videos" ON videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_videos" ON videos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_videos" ON videos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── backroom_builds ──
ALTER TABLE backroom_builds ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_backroom_builds" ON backroom_builds;
DROP POLICY IF EXISTS "anon_insert_backroom_builds" ON backroom_builds;
DROP POLICY IF EXISTS "anon_update_backroom_builds" ON backroom_builds;
DROP POLICY IF EXISTS "anon_delete_backroom_builds" ON backroom_builds;
CREATE POLICY "owner_select_backroom_builds" ON backroom_builds FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_backroom_builds" ON backroom_builds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_backroom_builds" ON backroom_builds FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_backroom_builds" ON backroom_builds FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── market_inventory ──
ALTER TABLE market_inventory ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_market_inventory" ON market_inventory;
DROP POLICY IF EXISTS "anon_insert_market_inventory" ON market_inventory;
DROP POLICY IF EXISTS "anon_update_market_inventory" ON market_inventory;
DROP POLICY IF EXISTS "anon_delete_market_inventory" ON market_inventory;
CREATE POLICY "owner_select_market_inventory" ON market_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_market_inventory" ON market_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_market_inventory" ON market_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_market_inventory" ON market_inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── car_offers ──
ALTER TABLE car_offers ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_car_offers" ON car_offers;
DROP POLICY IF EXISTS "anon_insert_car_offers" ON car_offers;
DROP POLICY IF EXISTS "anon_update_car_offers" ON car_offers;
DROP POLICY IF EXISTS "anon_delete_car_offers" ON car_offers;
CREATE POLICY "owner_select_car_offers" ON car_offers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_car_offers" ON car_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_car_offers" ON car_offers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_car_offers" ON car_offers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── guns ──
ALTER TABLE guns ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_guns" ON guns;
DROP POLICY IF EXISTS "anon_insert_guns" ON guns;
DROP POLICY IF EXISTS "anon_update_guns" ON guns;
DROP POLICY IF EXISTS "anon_delete_guns" ON guns;
CREATE POLICY "owner_select_guns" ON guns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_guns" ON guns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_guns" ON guns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_guns" ON guns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── range_scores ──
ALTER TABLE range_scores ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "anon_select_range_scores" ON range_scores;
DROP POLICY IF EXISTS "anon_insert_range_scores" ON range_scores;
DROP POLICY IF EXISTS "anon_update_range_scores" ON range_scores;
DROP POLICY IF EXISTS "anon_delete_range_scores" ON range_scores;
CREATE POLICY "owner_select_range_scores" ON range_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_range_scores" ON range_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_range_scores" ON range_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_range_scores" ON range_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);
