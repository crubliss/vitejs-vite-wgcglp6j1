/*
# Create trading and casino schema (single-tenant, no auth)

1. New Tables
- `wallet`: single-row table holding the user's virtual cash balance.
  - `id` (int, primary key, always 1)
  - `balance` (numeric, default 100000 — starting cash)
  - `updated_at` (timestamptz)
- `holdings`: current stock positions (one row per symbol).
  - `id` (uuid, primary key)
  - `symbol` (text, unique)
  - `quantity` (numeric, shares held)
  - `avg_price` (numeric, average buy price)
  - `updated_at` (timestamptz)
- `trades`: log of every buy/sell executed.
  - `id` (uuid, primary key)
  - `symbol` (text)
  - `action` (text: 'buy' or 'sell')
  - `quantity` (numeric)
  - `price` (numeric, price per share)
  - `total` (numeric, total dollar amount)
  - `created_at` (timestamptz)
- `game_history`: log of every casino game played.
  - `id` (uuid, primary key)
  - `game_type` (text: 'coinflip', 'dice', 'roulette', 'slots', 'crash')
  - `bet_amount` (numeric)
  - `payout` (numeric, amount returned — 0 means loss)
  - `result` (text, human-readable outcome)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on every table (single-tenant, intentionally public data).
*/

CREATE TABLE IF NOT EXISTS wallet (
  id int PRIMARY KEY DEFAULT 1,
  balance numeric NOT NULL DEFAULT 100000,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wallet_single_row CHECK (id = 1)
);

ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wallet" ON wallet;
CREATE POLICY "anon_select_wallet" ON wallet FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_wallet" ON wallet;
CREATE POLICY "anon_insert_wallet" ON wallet FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_wallet" ON wallet;
CREATE POLICY "anon_update_wallet" ON wallet FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_wallet" ON wallet;
CREATE POLICY "anon_delete_wallet" ON wallet FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_holdings" ON holdings;
CREATE POLICY "anon_select_holdings" ON holdings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_holdings" ON holdings;
CREATE POLICY "anon_insert_holdings" ON holdings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_holdings" ON holdings;
CREATE POLICY "anon_update_holdings" ON holdings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_holdings" ON holdings;
CREATE POLICY "anon_delete_holdings" ON holdings FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  action text NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trades" ON trades;
CREATE POLICY "anon_select_trades" ON trades FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trades" ON trades;
CREATE POLICY "anon_insert_trades" ON trades FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trades" ON trades;
CREATE POLICY "anon_update_trades" ON trades FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trades" ON trades;
CREATE POLICY "anon_delete_trades" ON trades FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  bet_amount numeric NOT NULL,
  payout numeric NOT NULL DEFAULT 0,
  result text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_history" ON game_history;
CREATE POLICY "anon_select_game_history" ON game_history FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_history" ON game_history;
CREATE POLICY "anon_insert_game_history" ON game_history FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_game_history" ON game_history;
CREATE POLICY "anon_update_game_history" ON game_history FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_game_history" ON game_history;
CREATE POLICY "anon_delete_game_history" ON game_history FOR DELETE
TO anon, authenticated USING (true);
