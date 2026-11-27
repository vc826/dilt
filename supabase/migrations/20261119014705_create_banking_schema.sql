/*
# Premium Banking Schema

Creates the full schema for a dark-themed premium digital banking app.
Single-tenant (no auth.users linkage) — the app uses a custom customer sign-in
flow against a `customers` table with Supabase Auth optional. For this app we
use a simple email/password approach stored in `customers` (hashed via a
security definer function) so the anon-key frontend can operate.

## 1. New Tables

### customers
- id (uuid, PK)
- email (text, unique)
- full_name (text)
- password_hash (text) — bcrypt-style hash stored server-side
- status (text: active|frozen|pending)
- created_at (timestamptz)

### accounts
- id (uuid, PK)
- customer_id (uuid, FK -> customers)
- account_number (text, unique)
- type (text: checking|savings|investment)
- balance (numeric, default 0)
- currency (text, default 'USD')
- created_at (timestamptz)

### cards
- id (uuid, PK)
- customer_id (uuid, FK -> customers)
- account_id (uuid, FK -> accounts)
- card_number_last4 (text)
- card_holder (text)
- expiry_month (int)
- expiry_year (int)
- type (text: debit|credit|virtual)
- status (text: active|blocked)
- created_at (timestamptz)

### transactions
- id (uuid, PK)
- account_id (uuid, FK -> accounts)
- type (text: deposit|withdrawal|transfer|payment)
- amount (numeric)
- description (text)
- counterparty (text)
- created_at (timestamptz)

### account_applications
- id (uuid, PK)
- full_name (text)
- email (text)
- phone (text)
- address (text)
- account_type (text)
- initial_deposit (numeric, default 0)
- status (text: pending|approved|rejected)
- password_hash (text)
- created_at (timestamptz)

### loans
- id (uuid, PK)
- customer_id (uuid, FK -> customers)
- amount (numeric)
- interest_rate (numeric)
- term_months (int)
- status (text: pending|approved|rejected|active|paid)
- created_at (timestamptz)

### messages
- id (uuid, PK)
- customer_id (uuid, FK -> customers)
- sender (text: customer|admin)
- body (text)
- read (boolean, default false)
- created_at (timestamptz)

### crypto_holdings
- id (uuid, PK)
- customer_id (uuid, FK -> customers)
- symbol (text)
- amount (numeric)
- created_at (timestamptz)

## 2. Security
- RLS enabled on all tables.
- Policies grant anon + authenticated full CRUD (single-tenant app where the
  anon-key frontend operates all data; real per-customer isolation is enforced
  in app logic via the selected customer id).
- service_role granted for edge function usage.
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'checking',
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number_last4 text NOT NULL,
  card_holder text NOT NULL,
  expiry_month int NOT NULL,
  expiry_year int NOT NULL,
  type text NOT NULL DEFAULT 'debit',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text,
  counterparty text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  account_type text NOT NULL DEFAULT 'checking',
  initial_deposit numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  password_hash text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  term_months int NOT NULL DEFAULT 12,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'customer',
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crypto_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_holdings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_applications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON loans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crypto_holdings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers, accounts, cards, transactions, account_applications, loans, messages, crypto_holdings TO service_role;

-- Helper: apply policies to a table for all verbs, anon+authenticated, using true (single-tenant shared data)
-- customers
DROP POLICY IF EXISTS "cust_sel" ON customers; CREATE POLICY "cust_sel" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cust_ins" ON customers; CREATE POLICY "cust_ins" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cust_upd" ON customers; CREATE POLICY "cust_upd" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cust_del" ON customers; CREATE POLICY "cust_del" ON customers FOR DELETE TO anon, authenticated USING (true);

-- accounts
DROP POLICY IF EXISTS "acc_sel" ON accounts; CREATE POLICY "acc_sel" ON accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "acc_ins" ON accounts; CREATE POLICY "acc_ins" ON accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "acc_upd" ON accounts; CREATE POLICY "acc_upd" ON accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "acc_del" ON accounts; CREATE POLICY "acc_del" ON accounts FOR DELETE TO anon, authenticated USING (true);

-- cards
DROP POLICY IF EXISTS "card_sel" ON cards; CREATE POLICY "card_sel" ON cards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "card_ins" ON cards; CREATE POLICY "card_ins" ON cards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "card_upd" ON cards; CREATE POLICY "card_upd" ON cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "card_del" ON cards; CREATE POLICY "card_del" ON cards FOR DELETE TO anon, authenticated USING (true);

-- transactions
DROP POLICY IF EXISTS "tx_sel" ON transactions; CREATE POLICY "tx_sel" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tx_ins" ON transactions; CREATE POLICY "tx_ins" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tx_upd" ON transactions; CREATE POLICY "tx_upd" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "tx_del" ON transactions; CREATE POLICY "tx_del" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- account_applications
DROP POLICY IF EXISTS "app_sel" ON account_applications; CREATE POLICY "app_sel" ON account_applications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "app_ins" ON account_applications; CREATE POLICY "app_ins" ON account_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "app_upd" ON account_applications; CREATE POLICY "app_upd" ON account_applications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "app_del" ON account_applications; CREATE POLICY "app_del" ON account_applications FOR DELETE TO anon, authenticated USING (true);

-- loans
DROP POLICY IF EXISTS "loan_sel" ON loans; CREATE POLICY "loan_sel" ON loans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "loan_ins" ON loans; CREATE POLICY "loan_ins" ON loans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "loan_upd" ON loans; CREATE POLICY "loan_upd" ON loans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "loan_del" ON loans; CREATE POLICY "loan_del" ON loans FOR DELETE TO anon, authenticated USING (true);

-- messages
DROP POLICY IF EXISTS "msg_sel" ON messages; CREATE POLICY "msg_sel" ON messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "msg_ins" ON messages; CREATE POLICY "msg_ins" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "msg_upd" ON messages; CREATE POLICY "msg_upd" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "msg_del" ON messages; CREATE POLICY "msg_del" ON messages FOR DELETE TO anon, authenticated USING (true);

-- crypto_holdings
DROP POLICY IF EXISTS "cryp_sel" ON crypto_holdings; CREATE POLICY "cryp_sel" ON crypto_holdings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cryp_ins" ON crypto_holdings; CREATE POLICY "cryp_ins" ON crypto_holdings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cryp_upd" ON crypto_holdings; CREATE POLICY "cryp_upd" ON crypto_holdings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cryp_del" ON crypto_holdings; CREATE POLICY "cryp_del" ON crypto_holdings FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_customer ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_customer ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_account ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_crypto_customer ON crypto_holdings(customer_id);