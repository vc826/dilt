import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Customer } from '@/lib/supabase';
import { simpleHash } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';

type AuthContextType = {
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ error: string | null }>;
  updateProfilePicture: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'agb_customer_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      (async () => {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', stored)
          .maybeSingle();
        if (data) setCustomer(data as Customer);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) return { error: 'Unable to connect. Try again.' };
    if (!data) return { error: 'No account found with that email.' };
    if (data.password_hash !== simpleHash(password))
      return { error: 'Incorrect password.' };
    if (data.status === 'pending')
      return { error: 'Your account is pending admin approval. Please wait for an approval email.' };
    if (data.status === 'frozen')
      return { error: 'Your account is frozen. Contact support.' };
    setCustomer(data as Customer);
    localStorage.setItem(STORAGE_KEY, data.id);
    return { error: null };
  };

  const signOut = () => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) return { error: 'Unable to connect. Try again.' };
    if (!data) return { error: 'No account found with that email.' };
    if (data.status === 'frozen') return { error: 'Your account is frozen. Contact support.' };

    const { error: updErr } = await supabase
      .from('customers')
      .update({ password_hash: simpleHash(newPassword) })
      .eq('id', data.id);
    if (updErr) return { error: 'Could not reset password. Try again.' };
    await notifyEmail(
      data.email,
      'Password Reset - Alliance Global Bank',
      'Your Alliance Global Bank account password has been reset successfully. If you did not make this change, please contact our support team immediately at contact@allianceglobalbank.com or call +1 (934) 203-2652.'
    );
    return { error: null };
  };

  const updateProfilePicture = async (url: string) => {
    if (!customer) return;
    await supabase.from('customers').update({ profile_picture: url }).eq('id', customer.id);
    setCustomer({ ...customer, profile_picture: url });
  };

  return (
    <AuthContext.Provider value={{ customer, loading, signIn, signOut, resetPassword, updateProfilePicture }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
