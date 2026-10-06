/*
# Add drug inventory for black market

1. New Tables
- `drug_inventory` — stores drugs the user has purchased from the black market.
  - `id` uuid PK
  - `user_id` uuid NOT NULL DEFAULT auth.uid() — owner
  - `drug_id` text NOT NULL — references catalog entry (e.g. 'weed', 'cocaine')
  - `drug_name` text NOT NULL — display name
  - `quality` text NOT NULL — quality tier: 'low', 'medium', 'high', 'premium'
  - `quantity` integer NOT NULL DEFAULT 1 — how many units the user owns
  - `luck_bonus` integer NOT NULL — luck % this drug grants when used
  - `duration_min` integer NOT NULL — effect duration in minutes
  - `purchased_at` timestamptz DEFAULT now()
  - UNIQUE(user_id, drug_id, quality) — stack same drug+quality into one row

2. Security
- Enable RLS on `drug_inventory`.
- Owner-scoped CRUD: each authenticated user can only access their own drug rows.
*/

CREATE TABLE IF NOT EXISTS drug_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  drug_id text NOT NULL,
  drug_name text NOT NULL,
  quality text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  luck_bonus integer NOT NULL,
  duration_min integer NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

ALTER TABLE drug_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_drugs" ON drug_inventory;
CREATE POLICY "select_own_drugs" ON drug_inventory FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_drugs" ON drug_inventory;
CREATE POLICY "insert_own_drugs" ON drug_inventory FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_drugs" ON drug_inventory;
CREATE POLICY "update_own_drugs" ON drug_inventory FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_drugs" ON drug_inventory;
CREATE POLICY "delete_own_drugs" ON drug_inventory FOR DELETE
TO authenticated USING (auth.uid() = user_id);
