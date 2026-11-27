import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Loan } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Coins, Plus } from 'lucide-react';

type Props = {
  loans: Loan[];
  onRefresh: () => void;
};

const LOAN_TYPES = [
  { label: 'Personal Loan', rate: 6.99, min: 5000, max: 100000 },
  { label: 'Home Mortgage', rate: 4.25, min: 50000, max: 500000 },
  { label: 'Auto Loan', rate: 5.49, min: 10000, max: 80000 },
  { label: 'Business Loan', rate: 8.99, min: 10000, max: 250000 },
];

export default function LoansTab({ loans, onRefresh }: Props) {
  const { customer } = useAuth();
  const [showApply, setShowApply] = useState(false);
  const [loanTypeIdx, setLoanTypeIdx] = useState(0);
  const [amount, setAmount] = useState(25000);
  const [term, setTerm] = useState(36);
  const [loading, setLoading] = useState(false);

  const loanType = LOAN_TYPES[loanTypeIdx];
  const monthlyRate = loanType.rate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));

  const handleApply = async () => {
    if (!customer) return;
    setLoading(true);
    await supabase.from('loans').insert({
      customer_id: customer.id,
      amount,
      interest_rate: loanType.rate,
      term_months: term,
      status: 'pending',
    });
    setLoading(false);
    setShowApply(false);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Loans</h1>
          <p className="text-gray-500 text-sm">Borrow on your terms — multiple loan options.</p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Apply for loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Coins className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No loans yet. Apply for one in seconds.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const monthly = (Number(loan.amount) * (Number(loan.interest_rate) / 100 / 12)) /
              (1 - Math.pow(1 + Number(loan.interest_rate) / 100 / 12, -loan.term_months));
            return (
              <div key={loan.id} className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-2xl text-white">{formatCurrency(Number(loan.amount))}</span>
                    <span className={`chip ${
                      loan.status === 'approved' || loan.status === 'active' ? 'bg-emerald2-500/15 text-emerald2-400' :
                      loan.status === 'rejected' ? 'bg-rose2-500/15 text-rose2-400' : 'bg-gold-400/15 text-gold-300'
                    }`}>{loan.status}</span>
                  </div>
                  <div className="text-sm text-gray-500">{loan.interest_rate}% APR · {loan.term_months} months · {formatCurrency(monthly)}/mo</div>
                  <div className="text-xs text-gray-600 mt-1">Applied {formatDate(loan.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showApply && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowApply(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1">Apply for a loan</h3>
            <p className="text-sm text-gray-500 mb-5">Choose your loan type and terms.</p>
            <div className="space-y-5">
              <div>
                <label className="label mb-1.5 block">Loan type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOAN_TYPES.map((lt, i) => (
                    <button key={lt.label} onClick={() => { setLoanTypeIdx(i); setAmount(lt.min); }}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        loanTypeIdx === i ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                      }`}>
                      <div className="font-semibold">{lt.label}</div>
                      <div className="text-xs opacity-70">{lt.rate}% APR</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="label">Amount</span>
                  <span className="font-display font-bold text-white">{formatCurrency(amount)}</span>
                </div>
                <input type="range" min={loanType.min} max={loanType.max} step="1000" value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-ink-700 appearance-none cursor-pointer accent-gold-400" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="label">Term</span>
                  <span className="font-display font-bold text-white">{term} months</span>
                </div>
                <input type="range" min="12" max="72" step="12" value={term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-ink-700 appearance-none cursor-pointer accent-gold-400" />
              </div>
              <div className="p-4 rounded-xl bg-ink-900/60 border border-white/5 text-center">
                <div className="label mb-1">Monthly payment</div>
                <div className="font-display font-extrabold text-3xl text-gradient-gold">{formatCurrency(monthlyPayment)}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowApply(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleApply} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
