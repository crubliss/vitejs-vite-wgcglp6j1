/*
# Add video likes/bot videos, car offers, market inventory, guns, range scores

1. Modified Tables
- `videos`: add `likes` (bigint, default 0), `is_bot` (boolean, default false),
  `creator_name` (text, default 'You'), `description` (text, default ''),
  `is_viral` (boolean, default false), `thumbnail_seed` (int, for bot thumbnails)

2. New Tables
- `market_inventory`: tracks stock for each car listing in the market.
  - id (uuid), listing_id (text, unique), in_stock (boolean), sold_at (timestamptz, nullable)
- `car_offers`: offers from NPC buyers on cars listed for sale in garage.
  - id (uuid), car_id (uuid FK to owned_cars), offer_amount (numeric),
    buyer_name (text), accepted (boolean default false), created_at (timestamptz)
- `guns`: crafted guns from the workshop.
  - id (uuid), name (text), frame (text), barrel (text), sight (text),
    damage (int), accuracy (int), fire_rate (int), created_at (timestamptz)
- `range_scores`: shooting range session scores.
  - id (uuid), score (int), targets_hit (int), accuracy_pct (numeric),
    gun_name (text), created_at (timestamptz)

3. Security
- Enable RLS on all new tables, allow anon + authenticated CRUD.
*/

ALTER TABLE videos ADD COLUMN IF NOT EXISTS likes bigint NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS creator_name text NOT NULL DEFAULT 'You';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_viral boolean NOT NULL DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_seed int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS market_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text UNIQUE NOT NULL,
  in_stock boolean NOT NULL DEFAULT true,
  sold_at timestamptz
);

ALTER TABLE market_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_market_inventory" ON market_inventory;
CREATE POLICY "anon_select_market_inventory" ON market_inventory FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_market_inventory" ON market_inventory;
CREATE POLICY "anon_insert_market_inventory" ON market_inventory FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_market_inventory" ON market_inventory;
CREATE POLICY "anon_update_market_inventory" ON market_inventory FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_market_inventory" ON market_inventory;
CREATE POLICY "anon_delete_market_inventory" ON market_inventory FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS car_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL,
  offer_amount numeric NOT NULL,
  buyer_name text NOT NULL,
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE car_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_car_offers" ON car_offers;
CREATE POLICY "anon_select_car_offers" ON car_offers FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_car_offers" ON car_offers;
CREATE POLICY "anon_insert_car_offers" ON car_offers FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_car_offers" ON car_offers;
CREATE POLICY "anon_update_car_offers" ON car_offers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_car_offers" ON car_offers;
CREATE POLICY "anon_delete_car_offers" ON car_offers FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS guns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frame text NOT NULL,
  barrel text NOT NULL,
  sight text NOT NULL,
  damage int NOT NULL DEFAULT 10,
  accuracy int NOT NULL DEFAULT 50,
  fire_rate int NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_guns" ON guns;
CREATE POLICY "anon_select_guns" ON guns FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_guns" ON guns;
CREATE POLICY "anon_insert_guns" ON guns FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_guns" ON guns;
CREATE POLICY "anon_update_guns" ON guns FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_guns" ON guns;
CREATE POLICY "anon_delete_guns" ON guns FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS range_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score int NOT NULL,
  targets_hit int NOT NULL,
  accuracy_pct numeric NOT NULL DEFAULT 0,
  gun_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE range_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_range_scores" ON range_scores;
CREATE POLICY "anon_select_range_scores" ON range_scores FOR SELECT
TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_range_scores" ON range_scores;
CREATE POLICY "anon_insert_range_scores" ON range_scores FOR INSERT
TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_range_scores" ON range_scores;
CREATE POLICY "anon_update_range_scores" ON range_scores FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_range_scores" ON range_scores;
CREATE POLICY "anon_delete_range_scores" ON range_scores FOR DELETE
TO anon, authenticated USING (true);
