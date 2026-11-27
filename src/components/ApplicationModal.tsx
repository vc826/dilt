import { useState } from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { simpleHash } from '@/lib/utils';

type ApplicationModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function ApplicationModal({ onClose, onSuccess }: ApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    account_type: 'checking',
    password: '',
  });

  const update = (k: string, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // Check if email already exists as a customer
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', form.email.toLowerCase())
        .maybeSingle();
      if (existing) {
        setError('An account with that email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }

      // Check if an application already exists
      const { data: existingApp } = await supabase
        .from('account_applications')
        .select('id')
        .eq('email', form.email.toLowerCase())
        .maybeSingle();
      if (existingApp) {
        setError('An application with that email is already pending.');
        setLoading(false);
        return;
      }

      const { error: insError } = await supabase.from('account_applications').insert({
        full_name: form.full_name,
        email: form.email.toLowerCase(),
        phone: form.phone,
        address: form.address,
        account_type: form.account_type,
        initial_deposit: 0,
        status: 'pending',
        password_hash: simpleHash(form.password),
      });
      if (insError) throw insError;
      setStep(4);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
      <div
        className="relative glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gold-400 w-8' : 'bg-white/10 w-4'
                }`}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-extrabold text-2xl text-white mb-1">Open your account</h2>
            <p className="text-sm text-gray-500 mb-6">Let's start with the basics.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  placeholder="Adrienne Hartley"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="input-field"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.full_name || !form.email || !form.phone}
                className="btn-primary w-full disabled:opacity-40"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-extrabold text-2xl text-white mb-1">Account details</h2>
            <p className="text-sm text-gray-500 mb-6">Choose your account type and deposit.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="123 Main St, New York, NY 10001"
                  className="input-field min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Account type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['checking', 'savings', 'investment'].map((t) => (
                    <button
                      key={t}
                      onClick={() => update('account_type', t)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                        form.account_type === t
                          ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200'
                          : 'bg-ink-900/60 border border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.address}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-extrabold text-2xl text-white mb-1">Secure your account</h2>
            <p className="text-sm text-gray-500 mb-6">Create a password to access your account.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field"
                />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost flex-1">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || form.password.length < 6}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {loading ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald2-500/20 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-emerald2-400" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-2">Application received!</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Your application is now pending review by Alliance Global Bank
              administration. You will receive an email once your account is
              approved and ready to use.
            </p>
            {error && (
              <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400 mb-4">
                {error}
              </div>
            )}
            <button onClick={onClose} className="btn-primary w-full">
              Close <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
