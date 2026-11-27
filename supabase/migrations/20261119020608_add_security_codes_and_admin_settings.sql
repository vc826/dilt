/*
# Add transfer security codes, admin settings, and admin password management

1. New Tables
- `security_codes`: Stores transfer clearance security codes assigned to customers by admin.
  - `id` (uuid, PK)
  - `customer_id` (uuid, FK to customers, cascade delete)
  - `section_number` (int 1-4): which of the 4 sections this code belongs to
  - `writeup` (text): the word/phrase the user must read and reference
  - `code_digits` (text, 4 chars): the 4-digit code the user must enter for this section
  - `created_at` (timestamptz)
- `admin_settings`: Singleton-style table for global admin configuration.
  - `id` (int, PK, always 1)
  - `admin_password_hash` (text): hashed admin password (replaces hardcoded check)
  - `security_codes_enabled` (boolean, default false): global on/off for requiring security codes during transfers
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on both new tables.
- Grant CRUD to anon + authenticated (single-tenant demo app, admin panel uses anon-key client).
- Policies use USING(true) / WITH CHECK(true) — data is intentionally shared in this demo.

3. Important Notes
- `security_codes` has 4 rows per customer (section_number 1-4), each with a writeup and a 4-digit code.
- When `admin_settings.security_codes_enabled` is true AND a customer has security codes assigned,
  transfers require the user to enter all 4 code digits (one per section) before the transfer completes.
- Admin can toggle the global on/off at any time.
- Admin password is stored hashed in admin_settings row 1. On first run, seeded with hash of 'admin123'.
*/

CREATE TABLE IF NOT EXISTS security_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  section_number int NOT NULL CHECK (section_number BETWEEN 1 AND 4),
  writeup text NOT NULL DEFAULT '',
  code_digits text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (customer_id, section_number)
);

ALTER TABLE security_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_codes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_security_codes" ON security_codes;
CREATE POLICY "anon_select_security_codes" ON security_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_security_codes" ON security_codes;
CREATE POLICY "anon_insert_security_codes" ON security_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_security_codes" ON security_codes;
CREATE POLICY "anon_update_security_codes" ON security_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_security_codes" ON security_codes;
CREATE POLICY "anon_delete_security_codes" ON security_codes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS admin_settings (
  id int PRIMARY KEY DEFAULT 1,
  admin_password_hash text NOT NULL,
  security_codes_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT admin_settings_singleton CHECK (id = 1)
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON admin_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_admin_settings" ON admin_settings;
CREATE POLICY "anon_select_admin_settings" ON admin_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admin_settings" ON admin_settings;
CREATE POLICY "anon_insert_admin_settings" ON admin_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admin_settings" ON admin_settings;
CREATE POLICY "anon_update_admin_settings" ON admin_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed the singleton admin_settings row with default password 'admin123'
-- simpleHash('admin123') in JS produces h + abs(hash).toString(16)
-- We insert a placeholder; the app will set the correct hash on first login.
INSERT INTO admin_settings (id, admin_password_hash, security_codes_enabled)
VALUES (1, 'seed', false)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_security_codes_customer ON security_codes(customer_id);
