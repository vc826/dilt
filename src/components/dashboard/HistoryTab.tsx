import { useState, useRef } from 'react';
import { supabase, Transaction, Account } from '@/lib/supabase';
import { formatCurrency, formatDateTime, maskAccount } from '@/lib/utils';
import { Receipt, Download, Trash2, FileText, Check } from 'lucide-react';

type Props = {
  transactions: Transaction[];
  accounts: Account[];
  onRefresh: () => void;
};

export default function HistoryTab({ transactions, accounts, onRefresh }: Props) {
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showStatement, setShowStatement] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filtered = transactions.filter((tx) => {
    if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false;
    if (filterType !== 'all' && tx.type !== filterType) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction from history? This cannot be undone.')) return;
    await supabase.from('transactions').delete().eq('id', id);
    onRefresh();
  };

  const handleDownloadReceipt = () => {
    if (!receiptRef.current || !selectedTx) return;
    const tx = selectedTx;
    const acct = accounts.find((a) => a.id === tx.account_id);
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  body { font-family: Georgia, serif; background: #0a0c14; color: #fff; padding: 40px; max-width: 600px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #d4a857; padding-bottom: 20px; margin-bottom: 30px; }
  .bank-name { font-size: 28px; font-weight: bold; color: #d4a857; letter-spacing: 2px; }
  .bank-sub { font-size: 11px; color: #888; letter-spacing: 3px; text-transform: uppercase; }
  .contact { font-size: 10px; color: #666; margin-top: 8px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #222; }
  .label { color: #888; font-size: 12px; text-transform: uppercase; }
  .value { color: #fff; font-weight: bold; }
  .amount { font-size: 32px; text-align: center; color: ${tx.type === 'deposit' ? '#34d399' : '#fb7185'}; margin: 20px 0; font-weight: bold; }
  .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #555; }
</style></head><body>
  <div class="header">
    <div class="bank-name">Alliance Global Bank</div>
    <div class="bank-sub">Private Banking</div>
    <div class="contact">contact@allianceglobalbank.com · +1 (934) 203-2652</div>
    <div class="contact">New Orleans, LA · Frankfurt, Germany · London, UK</div>
  </div>
  <div class="row"><span class="label">Transaction ID</span><span class="value">${tx.id.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${formatDateTime(tx.created_at)}</span></div>
  <div class="row"><span class="label">Account</span><span class="value">${acct ? acct.account_number : '—'}</span></div>
  <div class="row"><span class="label">Type</span><span class="value">${tx.type}</span></div>
  <div class="row"><span class="label">Counterparty</span><span class="value">${tx.counterparty || '—'}</span></div>
  <div class="row"><span class="label">Narration</span><span class="value">${tx.narration || tx.description || '—'}</span></div>
  <div class="amount">${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(Number(tx.amount))}</div>
  <div class="footer">This is a system-generated receipt from Alliance Global Bank.<br>For inquiries: contact@allianceglobalbank.com</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${tx.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStatement = () => {
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Account Statement</title>
<style>
  body { font-family: Arial, sans-serif; background: #0a0c14; color: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #d4a857; padding-bottom: 20px; margin-bottom: 30px; }
  .bank-name { font-size: 28px; font-weight: bold; color: #d4a857; }
  .contact { font-size: 10px; color: #666; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { text-align: left; padding: 10px; border-bottom: 2px solid #d4a857; color: #d4a857; font-size: 12px; text-transform: uppercase; }
  td { padding: 10px; border-bottom: 1px solid #222; font-size: 13px; }
  .deposit { color: #34d399; } .withdrawal { color: #fb7185; }
  .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #555; }
</style></head><body>
  <div class="header">
    <div class="bank-name">Alliance Global Bank</div>
    <div class="bank-sub" style="font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase">Account Statement</div>
    <div class="contact">contact@allianceglobalbank.com · +1 (934) 203-2652</div>
    <div class="contact">New Orleans, LA · Frankfurt, Germany · London, UK</div>
  </div>
  <p style="color:#888;font-size:12px">Generated on: ${formatDateTime(new Date().toISOString())}</p>
  <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Counterparty</th><th>Amount</th></tr></thead><tbody>
  ${filtered.map((tx) => `<tr><td>${formatDateTime(tx.created_at)}</td><td>${tx.type}</td><td>${tx.narration || tx.description || '—'}</td><td>${tx.counterparty || '—'}</td><td class="${tx.type === 'deposit' ? 'deposit' : 'withdrawal'}">${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(Number(tx.amount))}</td></tr>`).join('')}
  </tbody></table>
  <div class="footer">Alliance Global Bank · contact@allianceglobalbank.com · +1 (934) 203-2652</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Transaction History</h1>
          <p className="text-gray-500 text-sm">Full transaction view, receipts, and statements.</p>
        </div>
        <button onClick={handleDownloadStatement} className="btn-ghost text-sm py-2">
          <FileText className="w-4 h-4" /> Download statement
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="input-field text-sm max-w-[200px]">
          <option value="all">All accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.type} — {maskAccount(a.account_number)}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field text-sm max-w-[150px]">
          <option value="all">All types</option>
          <option value="deposit">Deposits</option>
          <option value="transfer">Transfers</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="payment">Payments</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No transactions found.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="space-y-1">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  tx.type === 'deposit' ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-rose2-500/15 text-rose2-400'
                }`}>
                  {tx.type === 'deposit' ? <Check className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{tx.narration || tx.description || tx.type}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(tx.created_at)} · {tx.type}</div>
                </div>
                <div className={`font-mono text-sm font-medium ${tx.type === 'deposit' ? 'text-emerald2-400' : 'text-rose2-400'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedTx(tx)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gold-400 transition-colors" title="View receipt">
                    <Receipt className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-rose2-400 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedTx(null)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-8 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div ref={receiptRef}>
              <div className="text-center border-b border-gold-400/20 pb-4 mb-6">
                <div className="font-display font-extrabold text-2xl text-gold-400">Alliance Global Bank</div>
                <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mt-1">Official Receipt</div>
                <div className="text-[10px] text-gray-600 mt-2">contact@allianceglobalbank.com · +1 (934) 203-2652</div>
              </div>
              <div className="space-y-3">
                <Row label="Transaction ID" value={selectedTx.id.slice(0, 8).toUpperCase()} />
                <Row label="Date" value={formatDateTime(selectedTx.created_at)} />
                <Row label="Type" value={selectedTx.type} />
                <Row label="Counterparty" value={selectedTx.counterparty || '—'} />
                <Row label="Narration" value={selectedTx.narration || selectedTx.description || '—'} />
                <div className={`text-center font-display font-extrabold text-3xl py-4 ${
                  selectedTx.type === 'deposit' ? 'text-emerald2-400' : 'text-rose2-400'
                }`}>
                  {selectedTx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(selectedTx.amount))}
                </div>
              </div>
              <div className="text-center text-[10px] text-gray-600 mt-4 border-t border-white/5 pt-4">
                Alliance Global Bank · New Orleans, LA · Frankfurt, Germany · London, UK
              </div>
            </div>
            <button onClick={handleDownloadReceipt} className="btn-primary w-full mt-6">
              <Download className="w-4 h-4" /> Download receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <span className="text-sm text-white font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
