import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, CryptoHolding, Account } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';
import { Bitcoin, ArrowUpDown } from 'lucide-react';
import { CRYPTO_PRICES } from '@/components/CustomerDashboard';

type Props = {
  holdings: CryptoHolding[];
  accounts: Account[];
  onRefresh: () => void;
};

export default function CryptoTab({ holdings, accounts, onRefresh }: Props) {
  const { customer } = useAuth();
  const [showSwap, setShowSwap] = useState(false);
  const [swapFrom, setSwapFrom] = useState('USD');
  const [swapTo, setSwapTo] = useState('BTC');
  const [swapAmt, setSwapAmt] = useState('');
  const [swapErr, setSwapErr] = useState<string | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);

  const totalValue = holdings.reduce((s, h) => {
    const price = CRYPTO_PRICES[h.symbol] || 0;
    return s + Number(h.amount) * price;
  }, 0);

  const handleSwap = async () => {
    setSwapErr(null);
    if (!customer) return;
    const amt = Number(swapAmt);
    if (!amt || amt <= 0) { setSwapErr('Enter a valid amount.'); return; }
    setSwapLoading(true);

    if (swapFrom === 'USD') {
      const checking = accounts.find((a) => a.type === 'checking') || accounts[0];
      if (!checking) { setSwapErr('No account available.'); setSwapLoading(false); return; }
      if (amt > Number(checking.balance)) { setSwapErr('Insufficient USD balance.'); setSwapLoading(false); return; }
      await supabase.from('accounts').update({ balance: Number(checking.balance) - amt }).eq('id', checking.id);
      await supabase.from('transactions').insert({
        account_id: checking.id, type: 'payment', amount: amt,
        description: `Bought ${swapTo}`, narration: `Crypto purchase: ${swapTo}`,
        counterparty: 'AGB Crypto',
      });
      const existing = holdings.find((h) => h.symbol === swapTo);
      const price = CRYPTO_PRICES[swapTo] || 1;
      const cryptoAmt = amt / price;
      if (existing) {
        await supabase.from('crypto_holdings').update({ amount: Number(existing.amount) + cryptoAmt }).eq('id', existing.id);
      } else {
        await supabase.from('crypto_holdings').insert({ customer_id: customer.id, symbol: swapTo, amount: cryptoAmt });
      }
    } else {
      const holding = holdings.find((h) => h.symbol === swapFrom);
      if (!holding) { setSwapErr(`No ${swapFrom} holding.`); setSwapLoading(false); return; }
      const price = CRYPTO_PRICES[swapFrom] || 1;
      const usdValue = amt * price;
      if (amt > Number(holding.amount)) { setSwapErr(`Insufficient ${swapFrom}.`); setSwapLoading(false); return; }
      const checking = accounts.find((a) => a.type === 'checking') || accounts[0];
      if (checking) {
        await supabase.from('accounts').update({ balance: Number(checking.balance) + usdValue }).eq('id', checking.id);
        await supabase.from('transactions').insert({
          account_id: checking.id, type: 'deposit', amount: usdValue,
          description: `Sold ${swapFrom}`, narration: `Crypto sale: ${swapFrom}`,
          counterparty: 'AGB Crypto',
        });
      }
      const newAmt = Number(holding.amount) - amt;
      if (newAmt <= 0) {
        await supabase.from('crypto_holdings').delete().eq('id', holding.id);
      } else {
        await supabase.from('crypto_holdings').update({ amount: newAmt }).eq('id', holding.id);
      }
    }
    setSwapLoading(false);
    setShowSwap(false);
    setSwapAmt('');
    if (customer) {
      await notifyEmail(customer.email, 'Crypto Transaction Alert - Alliance Global Bank', `${action === 'buy' ? 'Bought' : 'Sold'} ${formatCurrency(amt)} worth of ${symbol} from your account (•••• ${acct.account_number.slice(-4)}).`);
    }
    onRefresh();
  };

  const coins = Object.keys(CRYPTO_PRICES);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Crypto</h1>
          <p className="text-gray-500 text-sm">Buy, hold, sell, and invest in digital assets.</p>
        </div>
        <button onClick={() => setShowSwap(true)} className="btn-primary text-sm py-2">
          <ArrowUpDown className="w-4 h-4" /> Trade
        </button>
      </div>

      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-emerald2-500/10 blur-3xl" />
        <div className="relative">
          <div className="label mb-2">Portfolio value</div>
          <div className="font-display font-extrabold text-4xl text-white mb-4">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bitcoin className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No crypto holdings yet. Click Trade to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((h) => {
            const price = CRYPTO_PRICES[h.symbol] || 0;
            const value = Number(h.amount) * price;
            return (
              <div key={h.id} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400/20 to-ink-700 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white">{h.symbol}</div>
                    <div className="text-xs text-gray-500">${price.toLocaleString()}</div>
                  </div>
                </div>
                <div className="font-mono text-sm text-white">{Number(h.amount).toFixed(6)} {h.symbol}</div>
                <div className="font-display font-bold text-lg text-emerald2-400 mt-1">{formatCurrency(value)}</div>
              </div>
            );
          })}
        </div>
      )}

      {showSwap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowSwap(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1">Trade crypto</h3>
            <p className="text-sm text-gray-500 mb-5">Buy or sell instantly.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5 block">From</label>
                  <select value={swapFrom} onChange={(e) => setSwapFrom(e.target.value)} className="input-field">
                    <option value="USD">USD</option>
                    {coins.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5 block">To</label>
                  <select value={swapTo} onChange={(e) => setSwapTo(e.target.value)} className="input-field">
                    {coins.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Amount</label>
                <input type="number" value={swapAmt} onChange={(e) => setSwapAmt(e.target.value)} placeholder={swapFrom === 'USD' ? '0.00' : '0.000000'} className="input-field" />
                {swapFrom !== 'USD' && swapAmt && <p className="text-xs text-gray-500 mt-2">≈ {formatCurrency(Number(swapAmt) * (CRYPTO_PRICES[swapFrom] || 0))}</p>}
                {swapFrom === 'USD' && swapAmt && swapTo !== 'USD' && <p className="text-xs text-gray-500 mt-2">≈ {(Number(swapAmt) / (CRYPTO_PRICES[swapTo] || 1)).toFixed(6)} {swapTo}</p>}
              </div>
              {swapErr && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{swapErr}</div>}
              <div className="flex gap-3">
                <button onClick={() => setShowSwap(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleSwap} disabled={swapLoading} className="btn-primary flex-1 disabled:opacity-50">
                  {swapLoading ? 'Processing…' : 'Confirm trade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
