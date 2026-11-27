import { useState } from 'react';
import { X, Mail, Lock, ArrowRight, KeyRound, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type AuthModalProps = {
  onClose: () => void;
  onApply: () => void;
};

export default function AuthModal({ onClose, onApply }: AuthModalProps) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) setError(error);
    else onClose();
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    const { error } = await resetPassword(email, newPassword);
    if (error) setError(error);
    else {
      setResetSuccess(true);
      setForgotMode(false);
      setNewPassword('');
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
        className="relative glass-card p-8 w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {resetSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald2-500/20 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-emerald2-400" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-2">Password reset!</h2>
            <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now sign in.</p>
            <button
              onClick={() => setResetSuccess(false)}
              className="btn-primary w-full"
            >
              Sign in now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : forgotMode ? (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold-400/15 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-6 h-6 text-gold-400" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white mb-1">Reset password</h2>
              <p className="text-sm text-gray-500">Enter your email and a new password.</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Please wait…' : 'Reset password'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
            <div className="text-center mt-6 text-sm text-gray-500">
              Remember your password?{' '}
              <button
                onClick={() => { setForgotMode(false); setError(null); }}
                className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
              >
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="font-display font-extrabold text-2xl text-white mb-1">Welcome back</h2>
              <p className="text-sm text-gray-500">Sign in to access your Alliance Global Bank account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Please wait…' : 'Sign in'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
            <div className="text-center mt-6 text-sm text-gray-500 space-y-2">
              <div>
                <button
                  onClick={() => { setForgotMode(true); setError(null); }}
                  className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div>
                Don't have an account?{' '}
                <button
                  onClick={() => { setError(null); onClose(); onApply(); }}
                  className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
                >
                  Apply now
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
