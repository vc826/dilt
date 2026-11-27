import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, BillPayment, Account } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';
import { Zap, Tv, Check } from 'lucide-react';

type Props = {
  bills: BillPayment[];
  accounts: Account[];
  onRefresh: () => void;
};

const ELECTRICITY_PROVIDERS = ['National Grid', 'Duke Energy', 'PG&E', 'ConEd', 'Southern Company'];
const TV_PROVIDERS = ['Comcast Xfinity', 'Dish Network', 'DirecTV', 'Spectrum', 'Cox Communications'];

export default function BillsTab({ bills, accounts, onRefresh }: Props) {
  const { customer } = useAuth();
  const [showPay, setShowPay] = useState(false);
  const [billType, setBillType] = useState<'electricity' | 'tv'>('electricity');
  const [provider, setProvider] = useState('');
  const [meterOrAccount, setMeterOrAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = billType === 'electricity' ? ELECTRICITY_PROVIDERS : TV_PROVIDERS;

  const handlePay = async () => {
    setError(null);
    if (!customer) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!provider) { setError('Select a provider.'); return; }
    if (!meterOrAccount.trim()) { setError('Enter meter/account number.'); return; }
    const sourceAcct = accounts.find((a) => a.id === fromAccount);
    if (!sourceAcct) { setError('Select a source account.'); return; }
    if (amt > Number(sourceAcct.balance)) { setError('Insufficient funds.'); return; }

    setLoading(true);
    await supabase.from('accounts').update({ balance: Number(sourceAcct.balance) - amt }).eq('id', sourceAcct.id);
    await supabase.from('transactions').insert({
      account_id: sourceAcct.id,
      type: 'payment',
      amount: amt,
      description: `${billType === 'electricity' ? 'Electricity' : 'TV/Cable'} payment — ${provider}`,
      narration: narration || `${billType} bill payment to ${provider} (${meterOrAccount})`,
      counterparty: provider,
    });
    await supabase.from('bill_payments').insert({
      customer_id: customer.id,
      account_id: sourceAcct.id,
      bill_type: billType,
      provider,
      meter_or_account: meterOrAccount,
      amount: amt,
      status: 'completed',
      narration: narration || `${billType} bill payment`,
    });

    setLoading(false);
    setShowPay(false);
    setAmount(''); setProvider(''); setMeterOrAccount(''); setNarration(''); setFromAccount('');
    if (customer) {
      await notifyEmail(customer.email, 'Bill Payment Alert - Alliance Global Bank', `${formatCurrency(amt)} paid for ${billType} (${provider}). Account: ${meterOrAccount}. ${narration ? 'Narration: ' + narration : ''}`);
    }
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Bill Payments</h1>
          <p className="text-gray-500 text-sm">Pay electricity and TV/cable bills instantly.</p>
        </div>
        <button onClick={() => setShowPay(true)} className="btn-primary text-sm py-2">
          <Zap className="w-4 h-4" /> Pay a bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Zap className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No bill payments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div key={bill.id} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                bill.bill_type === 'electricity' ? 'bg-gold-400/15 text-gold-400' : 'bg-emerald2-500/15 text-emerald2-400'
              }`}>
                {bill.bill_type === 'electricity' ? <Zap className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{bill.provider}</div>
                <div className="text-xs text-gray-500">{bill.bill_type} · {bill.meter_or_account} · {formatDate(bill.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-rose2-400">{formatCurrency(Number(bill.amount))}</span>
                <span className="chip bg-emerald2-500/15 text-emerald2-400"><Check className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPay(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1">Pay a bill</h3>
            <p className="text-sm text-gray-500 mb-5">Electricity or TV/cable payment.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Bill type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setBillType('electricity'); setProvider(''); }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      billType === 'electricity' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                    }`}><Zap className="w-4 h-4" /> Electricity</button>
                  <button onClick={() => { setBillType('tv'); setProvider(''); }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      billType === 'tv' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                    }`}><Tv className="w-4 h-4" /> TV/Cable</button>
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Provider</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className="input-field">
                  <option value="">Select provider…</option>
                  {providers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">{billType === 'electricity' ? 'Meter number' : 'Account number'}</label>
                <input type="text" value={meterOrAccount} onChange={(e) => setMeterOrAccount(e.target.value)} placeholder={billType === 'electricity' ? 'Meter number' : 'Account number'} className="input-field" />
              </div>
              <div>
                <label className="label mb-1.5 block">From account</label>
                <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="input-field">
                  <option value="">Select account…</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.type} — {formatCurrency(Number(a.balance))}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Narration</label>
                <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Optional description" className="input-field" />
              </div>
              {error && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setShowPay(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handlePay} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Paying…' : 'Pay bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
