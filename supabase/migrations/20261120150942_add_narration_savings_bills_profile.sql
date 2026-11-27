/*
# Add transaction narration, savings accounts, bill payments, and profile pictures

1. ALTER TABLE transactions: add `narration` text column for transaction descriptions
2. ALTER TABLE customers: add `profile_picture` text column for avatar URL
3. New table `savings_accounts`: customer savings with interest rate options
4. New table `bill_payments`: electricity and TV cable payment records

Important: No data loss — only ADDITIVE changes (new columns, new tables).
*/

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS narration text;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_picture text;

CREATE TABLE IF NOT EXISTS savings_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Savings',
  balance numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 2.5,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_accounts TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_savings" ON savings_accounts;
CREATE POLICY "anon_select_savings" ON savings_accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_savings" ON savings_accounts;
CREATE POLICY "anon_insert_savings" ON savings_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_savings" ON savings_accounts;
CREATE POLICY "anon_update_savings" ON savings_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_savings" ON savings_accounts;
CREATE POLICY "anon_delete_savings" ON savings_accounts FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bill_type text NOT NULL DEFAULT 'electricity',
  provider text NOT NULL DEFAULT '',
  meter_or_account text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  narration text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON bill_payments TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_bills" ON bill_payments;
CREATE POLICY "anon_select_bills" ON bill_payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bills" ON bill_payments;
CREATE POLICY "anon_insert_bills" ON bill_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bills" ON bill_payments;
CREATE POLICY "anon_update_bills" ON bill_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bills" ON bill_payments;
CREATE POLICY "anon_delete_bills" ON bill_payments FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_savings_customer ON savings_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bill_payments(customer_id);
