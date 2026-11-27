import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, SavingsAccount, Account } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';
import { PiggyBank, Plus, TrendingUp } from 'lucide-react';

type Props = {
  savings: SavingsAccount[];
  accounts: Account[];
  onRefresh: () => void;
};

const INTEREST_OPTIONS = [
  { rate: 2.5, label: '2.5% APY — Standard Savings', minDeposit: 100 },
  { rate: 4.0, label: '4.0% APY — Premium Savings', minDeposit: 1000 },
  { rate: 5.5, label: '5.5% APY — High-Yield Savings', minDeposit: 5000 },
  { rate: 7.0, label: '7.0% APY — Platinum Savings', minDeposit: 25000 },
];

export default function SavingsTab({ savings, accounts, onRefresh }: Props) {
  const { customer } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [rateIdx, setRateIdx] = useState(0);
  const [name, setName] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRate = INTEREST_OPTIONS[rateIdx];

  const handleCreate = async () => {
    setError(null);
    if (!customer) return;
    const deposit = Number(initialDeposit);
    if (!name.trim()) { setError('Enter a savings name.'); return; }
    if (deposit < selectedRate.minDeposit) { setError(`Minimum deposit is ${formatCurrency(selectedRate.minDeposit)}.`); return; }
    const sourceAcct = accounts.find((a) => a.id === fromAccount);
    if (!sourceAcct) { setError('Select a source account.'); return; }
    if (deposit > Number(sourceAcct.balance)) { setError('Insufficient funds in source account.'); return; }

    setLoading(true);
    const { data: newSav } = await supabase.from('savings_accounts').insert({
      customer_id: customer.id,
      name: name.trim(),
      balance: deposit,
      interest_rate: selectedRate.rate,
    }).select().single();

    if (newSav) {
      await supabase.from('accounts').update({ balance: Number(sourceAcct.balance) - deposit }).eq('id', sourceAcct.id);
      await supabase.from('transactions').insert({
        account_id: sourceAcct.id,
        type: 'withdrawal',
        amount: deposit,
        description: `Transfer to savings: ${name}`,
        narration: `Savings deposit to ${name} (${selectedRate.rate}% APY)`,
        counterparty: 'AGB Savings',
      });
    }

    setLoading(false);
    setShowCreate(false);
    setName('');
    setInitialDeposit('');
    setFromAccount('');
    if (customer) {
      await notifyEmail(customer.email, 'Savings Account Alert - Alliance Global Bank', `A new savings account "${name}" has been opened with an initial deposit of ${formatCurrency(deposit)} at ${rate}% interest rate.`);
    }
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Savings</h1>
          <p className="text-gray-500 text-sm">Grow your money with competitive interest rates.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Open savings
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <PiggyBank className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No savings accounts yet. Open one to start earning interest.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savings.map((sav) => {
            const monthlyInterest = Number(sav.balance) * (Number(sav.interest_rate) / 100 / 12);
            return (
              <div key={sav.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400/20 to-ink-700 flex items-center justify-center">
                      <PiggyBank className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white">{sav.name}</div>
                      <div className="text-xs text-gray-500">{sav.interest_rate}% APY</div>
                    </div>
                  </div>
                </div>
                <div className="font-display font-bold text-2xl text-white">{formatCurrency(Number(sav.balance))}</div>
                <div className="flex items-center gap-1 text-xs text-emerald2-400 mt-2">
                  <TrendingUp className="w-3 h-3" /> {formatCurrency(monthlyInterest)}/mo interest
                </div>
                <div className="text-xs text-gray-600 mt-2">Opened {formatDate(sav.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1">Open a savings account</h3>
            <p className="text-sm text-gray-500 mb-5">Choose your interest rate tier.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Interest rate tier</label>
                <div className="space-y-2">
                  {INTEREST_OPTIONS.map((opt, i) => (
                    <button key={i} onClick={() => setRateIdx(i)}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        rateIdx === i ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                      }`}>
                      <div className="flex justify-between">
                        <span>{opt.label}</span>
                        <span className="text-xs opacity-70">Min: {formatCurrency(opt.minDeposit)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Savings name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation Fund" className="input-field" />
              </div>
              <div>
                <label className="label mb-1.5 block">Fund from account</label>
                <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="input-field">
                  <option value="">Select account…</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.type} — {formatCurrency(Number(a.balance))}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Initial deposit</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input type="number" value={initialDeposit} onChange={(e) => setInitialDeposit(e.target.value)} placeholder={`Min: ${selectedRate.minDeposit}`} className="input-field" />
                </div>
              </div>
              {error && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Creating…' : 'Open savings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
