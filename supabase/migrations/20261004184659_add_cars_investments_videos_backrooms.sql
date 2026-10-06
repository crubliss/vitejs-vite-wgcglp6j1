/*
# Add cars, investments, videos, and backroom builds tables

1. New Tables
- `owned_cars`: cars the user owns (purchased from market or black market).
- `investments`: active investment positions that grow over time.
- `videos`: YouTube-style videos the user has posted that earn revenue.
- `backroom_builds`: saved 3D room layouts for the backrooms/poolrooms builder.

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD (single-tenant, intentionally public data).
*/

CREATE TABLE IF NOT EXISTS owned_cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year int NOT NULL,
  color text NOT NULL,
  purchase_price numeric NOT NULL,
  listed_price numeric,
  image_url text NOT NULL,
  source text NOT NULL DEFAULT 'market',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE owned_cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_owned_cars" ON owned_cars;
CREATE POLICY "anon_select_owned_cars" ON owned_cars FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_owned_cars" ON owned_cars;
CREATE POLICY "anon_insert_owned_cars" ON owned_cars FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_owned_cars" ON owned_cars;
CREATE POLICY "anon_update_owned_cars" ON owned_cars FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_owned_cars" ON owned_cars;
CREATE POLICY "anon_delete_owned_cars" ON owned_cars FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  amount numeric NOT NULL,
  current_value numeric NOT NULL,
  rate numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_investments" ON investments;
CREATE POLICY "anon_select_investments" ON investments FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_investments" ON investments;
CREATE POLICY "anon_insert_investments" ON investments FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_investments" ON investments;
CREATE POLICY "anon_update_investments" ON investments FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_investments" ON investments;
CREATE POLICY "anon_delete_investments" ON investments FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  views bigint NOT NULL DEFAULT 0,
  earnings numeric NOT NULL DEFAULT 0,
  posted_at timestamptz DEFAULT now(),
  last_update timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_videos" ON videos;
CREATE POLICY "anon_select_videos" ON videos FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
CREATE POLICY "anon_insert_videos" ON videos FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_videos" ON videos;
CREATE POLICY "anon_update_videos" ON videos FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "anon_delete_videos" ON videos FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS backroom_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  layout jsonb NOT NULL,
  theme text NOT NULL DEFAULT 'backrooms',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE backroom_builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_backroom_builds" ON backroom_builds;
CREATE POLICY "anon_select_backroom_builds" ON backroom_builds FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_backroom_builds" ON backroom_builds;
CREATE POLICY "anon_insert_backroom_builds" ON backroom_builds FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_backroom_builds" ON backroom_builds;
CREATE POLICY "anon_update_backroom_builds" ON backroom_builds FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_backroom_builds" ON backroom_builds;
CREATE POLICY "anon_delete_backroom_builds" ON backroom_builds FOR DELETE
TO anon, authenticated USING (true);
