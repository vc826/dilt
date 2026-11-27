import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Customer = {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  status: string;
  profile_picture: string | null;
  created_at: string;
};

export type Account = {
  id: string;
  customer_id: string;
  account_number: string;
  type: string;
  balance: number;
  currency: string;
  created_at: string;
};

export type Card = {
  id: string;
  customer_id: string;
  account_id: string;
  card_number_last4: string;
  card_holder: string;
  expiry_month: number;
  expiry_year: number;
  type: string;
  status: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  description: string | null;
  narration: string | null;
  counterparty: string | null;
  created_at: string;
};

export type AccountApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  account_type: string;
  initial_deposit: number;
  status: string;
  password_hash: string;
  created_at: string;
};

export type Loan = {
  id: string;
  customer_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  created_at: string;
};

export type Message = {
  id: string;
  customer_id: string;
  sender: string;
  body: string;
  read: boolean;
  created_at: string;
};

export type CryptoHolding = {
  id: string;
  customer_id: string;
  symbol: string;
  amount: number;
  created_at: string;
};

export type SecurityCode = {
  id: string;
  customer_id: string;
  section_number: number;
  writeup: string;
  code_digits: string;
  created_at: string;
};

export type AdminSettings = {
  id: number;
  admin_password_hash: string;
  security_codes_enabled: boolean;
  updated_at: string;
};

export type SavingsAccount = {
  id: string;
  customer_id: string;
  name: string;
  balance: number;
  interest_rate: number;
  currency: string;
  created_at: string;
};

export type BillPayment = {
  id: string;
  customer_id: string;
  account_id: string;
  bill_type: string;
  provider: string;
  meter_or_account: string;
  amount: number;
  status: string;
  narration: string | null;
  created_at: string;
};
