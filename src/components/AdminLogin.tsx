import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { supabase, AdminSettings } from '@/lib/supabase';
import { simpleHash } from '@/lib/utils';

const ADMIN_STORAGE = 'agb_admin_session';
const ADMIN_USERNAME = 'Allianze';
const DEFAULT_PASSWORD = 'wixxy.Alliance111@';
export { ADMIN_USERNAME, DEFAULT_PASSWORD };

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username !== ADMIN_USERNAME) {
      setErr('Incorrect username or password.');
      return;
    }

    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const storedHash = settings?.admin_password_hash;
    const inputHash = simpleHash(pw);

    if (storedHash === 'seed') {
      if (pw === DEFAULT_PASSWORD) {
        await supabase.from('admin_settings').update({ admin_password_hash: inputHash }).eq('id', 1);
        localStorage.setItem(ADMIN_STORAGE, '1');
        onSuccess();
      } else {
        setErr('Incorrect username or password.');
      }
    } else if (storedHash === inputHash) {
      localStorage.setItem(ADMIN_STORAGE, '1');
      onSuccess();
    } else {
      setErr('Incorrect username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-ink-950">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="relative glass-card p-8 w-full max-w-sm animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow-gold mx-auto mb-5">
          <Shield className="w-7 h-7 text-ink-950" strokeWidth={2} />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-white text-center mb-1">Admin Portal</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Alliance Global Bank — Staff access only</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter admin password"
              className="input-field"
            />
          </div>
          {err && (
            <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{err}</div>
          )}
          <button type="submit" className="btn-primary w-full">Sign in to admin</button>
        </form>
      </div>
    </div>
  );
}
