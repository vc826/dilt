import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Account, Transaction, SecurityCode, AdminSettings } from '@/lib/supabase';
import { formatCurrency, formatDate, maskAccount, generateCardLast4 } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';
import {
  Send, Plus, ArrowDownLeft, ArrowUpRight, Shield, Check,
  Globe, Home, ArrowLeftRight, Bitcoin,
} from 'lucide-react';

type Props = {
  accounts: Account[];
  transactions: Transaction[];
  onRefresh: () => void;
};

type TransferType = 'local' | 'international';
type ModalAction = 'transfer' | 'addMoney' | 'withdraw' | null;

export default function AccountsTab({ accounts, transactions, onRefresh }: Props) {
  const { customer } = useAuth();
  const [selected, setSelected] = useState<string | null>(accounts[0]?.id || null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [transferType, setTransferType] = useState<TransferType>('local');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [narration, setNarration] = useState('');
  const [withdrawTarget, setWithdrawTarget] = useState<'account' | 'crypto'>('account');
  const [withdrawToAccount, setWithdrawToAccount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Security code states
  const [step, setStep] = useState<'details' | 'security' | 'done'>('details');
  const [securityCodes, setSecurityCodes] = useState<SecurityCode[]>([]);
  const [codeInputs, setCodeInputs] = useState(['', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && accounts.length > 0) setSelected(accounts[0].id);
  }, [accounts, selected]);

  const selectedAcct = accounts.find((a) => a.id === selected);
  const acctTxns = transactions.filter((t) => t.account_id === selected);

  const openModal = (action: ModalAction) => {
    setError(null);
    setSuccess(false);
    setAmount('');
    setRecipient('');
    setRecipientCountry('');
    setNarration('');
    setStep('details');
    setModalAction(action);
  };

  const closeModal = () => {
    setModalAction(null);
    setStep('details');
    setAmount('');
    setRecipient('');
    setRecipientCountry('');
    setNarration('');
    setError(null);
    setCodeError(null);
    setCodeInputs(['', '', '', '']);
    setSuccess(false);
  };

  const handleDetailsSubmit = async () => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!selectedAcct) { setError('Select an account.'); return; }
    if (modalAction === 'addMoney') {
      await executeAction();
      return;
    }
    if (amt > Number(selectedAcct.balance)) { setError('Insufficient funds.'); return; }
    if (modalAction === 'transfer' && !recipient.trim()) { setError('Enter a recipient.'); return; }
    if (modalAction === 'withdraw' && withdrawTarget === 'account' && !withdrawToAccount) { setError('Select a destination account.'); return; }

    // Check security codes for transfers and withdrawals
    if ((modalAction === 'transfer' || modalAction === 'withdraw') && customer) {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (settings && (settings as AdminSettings).security_codes_enabled) {
        const { data: codes } = await supabase
          .from('security_codes')
          .select('*')
          .eq('customer_id', customer.id)
          .order('section_number', { ascending: true });
        if (codes && codes.length > 0) {
          setSecurityCodes(codes as SecurityCode[]);
          setCodeInputs(['', '', '', '']);
          setCodeError(null);
          setStep('security');
          return;
        }
      }
    }

    await executeAction();
  };

  const executeAction = async () => {
    setLoading(true);
    const amt = Number(amount);
    if (!selectedAcct) return;

    if (modalAction === 'addMoney') {
      const newBalance = Number(selectedAcct.balance) + amt;
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', selectedAcct.id);
      await supabase.from('transactions').insert({
        account_id: selectedAcct.id,
        type: 'deposit',
        amount: amt,
        description: 'Add money',
        narration: narration || 'Add money to account',
        counterparty: 'Alliance Global Bank',
      });
    } else if (modalAction === 'transfer') {
      const newBalance = Number(selectedAcct.balance) - amt;
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', selectedAcct.id);
      const desc = transferType === 'international'
        ? `International transfer to ${recipient}${recipientCountry ? ` (${recipientCountry})` : ''}`
        : `Local transfer to ${recipient}`;
      await supabase.from('transactions').insert({
        account_id: selectedAcct.id,
        type: 'transfer',
        amount: amt,
        description: desc,
        narration: narration || desc,
        counterparty: recipient,
      });
    } else if (modalAction === 'withdraw') {
      if (withdrawTarget === 'account') {
        // Transfer to another own account
        const destAcct = accounts.find((a) => a.id === withdrawToAccount);
        if (destAcct) {
          await supabase.from('accounts').update({ balance: Number(selectedAcct.balance) - amt }).eq('id', selectedAcct.id);
          await supabase.from('accounts').update({ balance: Number(destAcct.balance) + amt }).eq('id', destAcct.id);
          await supabase.from('transactions').insert({
            account_id: selectedAcct.id,
            type: 'withdrawal',
            amount: amt,
            description: `Withdrawal to ${maskAccount(destAcct.account_number)}`,
            narration: narration || `Withdrawal to own account`,
            counterparty: 'Self transfer',
          });
          await supabase.from('transactions').insert({
            account_id: destAcct.id,
            type: 'deposit',
            amount: amt,
            description: `Received from ${maskAccount(selectedAcct.account_number)}`,
            narration: narration || `Transfer from own account`,
            counterparty: 'Self transfer',
          });
        }
      } else {
        // Withdraw to crypto (convert USD to BTC)
        const newBalance = Number(selectedAcct.balance) - amt;
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', selectedAcct.id);
        await supabase.from('transactions').insert({
          account_id: selectedAcct.id,
          type: 'withdrawal',
          amount: amt,
          description: 'Withdrawal to crypto (BTC)',
          narration: narration || 'Withdrawal to crypto wallet',
          counterparty: 'AGB Crypto',
        });
        const price = 64210.5;
        const cryptoAmt = amt / price;
        const { data: existing } = await supabase.from('crypto_holdings').select('*').eq('customer_id', customer!.id).eq('symbol', 'BTC').maybeSingle();
        if (existing) {
          await supabase.from('crypto_holdings').update({ amount: Number(existing.amount) + cryptoAmt }).eq('id', existing.id);
        } else {
          await supabase.from('crypto_holdings').insert({ customer_id: customer!.id, symbol: 'BTC', amount: cryptoAmt });
        }
      }
    }

    if (customer) {
      const action = modalAction === 'transfer' ? 'sent' : modalAction === 'withdraw' ? 'withdrawn' : 'added';
      const subject = `${modalAction === 'transfer' ? 'Transfer' : modalAction === 'withdraw' ? 'Withdrawal' : 'Deposit'} Alert - Alliance Global Bank`;
      await notifyEmail(customer.email, subject, `${formatCurrency(amt)} has been ${action} ${modalAction === 'transfer' ? `to ${recipient}` : modalAction === 'withdraw' ? 'from' : 'to'} your account (•••• ${selectedAcct.account_number.slice(-4)}). ${narration ? 'Narration: ' + narration : ''}`);
    }

    setLoading(false);
    setStep('done');
  };

  const handleSecurityCodeSubmit = async () => {
    setCodeError(null);
    for (let i = 0; i < 4; i++) {
      const expected = securityCodes.find((c) => c.section_number === i + 1);
      if (!expected) { setCodeError('Security codes not properly configured. Contact support.'); return; }
      if (codeInputs[i] !== expected.code_digits) {
        setCodeError(`Section ${i + 1}: incorrect code. Please try again.`);
        return;
      }
    }
    await executeAction();
  };

  const handleCodeInput = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setCodeInputs((p) => p.map((v, i) => (i === index ? clean : v)));
  };

  const modalTitle = modalAction === 'transfer' ? 'Send money' : modalAction === 'addMoney' ? 'Add money' : modalAction === 'withdraw' ? 'Withdraw' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Accounts</h1>
          <p className="text-gray-500 text-sm">Manage your money — transfer, add, withdraw.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => openModal('addMoney')} className="btn-ghost text-sm py-2">
            <Plus className="w-4 h-4" /> Add money
          </button>
          <button onClick={() => openModal('withdraw')} className="btn-ghost text-sm py-2">
            <ArrowLeftRight className="w-4 h-4" /> Withdraw
          </button>
          <button onClick={() => openModal('transfer')} className="btn-primary text-sm py-2">
            <Send className="w-4 h-4" /> Transfer
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500">No accounts yet. Contact support to open one.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={`glass-card p-5 text-left transition-all ${
                  selected === a.id ? 'border-gold-400/40 ring-1 ring-gold-400/20' : 'hover:-translate-y-0.5'
                }`}
              >
                <div className="text-xs text-gold-400 uppercase tracking-wider mb-1">{a.type}</div>
                <div className="font-display font-bold text-2xl text-white mb-1">{formatCurrency(Number(a.balance))}</div>
                <div className="font-mono text-xs text-gray-500">{a.account_number}</div>
              </button>
            ))}
          </div>

          {selectedAcct && (
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-white mb-4">
                Transactions — {selectedAcct.account_number}
              </h3>
              {acctTxns.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No transactions for this account.</p>
              ) : (
                <div className="space-y-2">
                  {acctTxns.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-rose2-500/15 text-rose2-400'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{tx.narration || tx.description || tx.type}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(tx.created_at)} {tx.counterparty && `· ${tx.counterparty}`}
                        </div>
                      </div>
                      <div className={`font-mono text-sm font-medium ${
                        tx.type === 'deposit' ? 'text-emerald2-400' : 'text-rose2-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalAction && selectedAcct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeModal}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {step === 'details' && (
              <>
                <h3 className="font-display font-bold text-xl text-white mb-1">{modalTitle}</h3>
                <p className="text-sm text-gray-500 mb-5">From {selectedAcct.account_number}</p>
                <div className="space-y-4">
                  {modalAction === 'transfer' && (
                    <div>
                      <label className="label mb-1.5 block">Transfer type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTransferType('local')}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            transferType === 'local' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                          }`}
                        >
                          <Home className="w-4 h-4" /> Local
                        </button>
                        <button
                          onClick={() => setTransferType('international')}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            transferType === 'international' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                          }`}
                        >
                          <Globe className="w-4 h-4" /> International
                        </button>
                      </div>
                    </div>
                  )}

                  {modalAction === 'transfer' && (
                    <>
                      <div>
                        <label className="label mb-1.5 block">Recipient name / account</label>
                        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name or account number" className="input-field" />
                      </div>
                      {transferType === 'international' && (
                        <div>
                          <label className="label mb-1.5 block">Recipient country</label>
                          <input type="text" value={recipientCountry} onChange={(e) => setRecipientCountry(e.target.value)} placeholder="e.g. United Kingdom" className="input-field" />
                        </div>
                      )}
                    </>
                  )}

                  {modalAction === 'withdraw' && (
                    <div>
                      <label className="label mb-1.5 block">Withdraw to</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setWithdrawTarget('account')}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            withdrawTarget === 'account' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                          }`}
                        >
                          <ArrowLeftRight className="w-4 h-4" /> Account
                        </button>
                        <button
                          onClick={() => setWithdrawTarget('crypto')}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            withdrawTarget === 'crypto' ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                          }`}
                        >
                          <Bitcoin className="w-4 h-4" /> Crypto
                        </button>
                      </div>
                    </div>
                  )}

                  {modalAction === 'withdraw' && withdrawTarget === 'account' && (
                    <div>
                      <label className="label mb-1.5 block">Destination account</label>
                      <select value={withdrawToAccount} onChange={(e) => setWithdrawToAccount(e.target.value)} className="input-field">
                        <option value="">Select account…</option>
                        {accounts.filter((a) => a.id !== selectedAcct.id).map((a) => (
                          <option key={a.id} value={a.id}>{a.type} — {a.account_number}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label mb-1.5 block">Amount</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="label mb-1.5 block">Narration / Description</label>
                    <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="What's this for?" className="input-field" />
                  </div>

                  {error && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{error}</div>}

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={handleDetailsSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                      {loading ? 'Checking…' : 'Continue'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'security' && (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gold-400/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">Transfer security</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Enter the 4-digit code for each section to authorize this transaction of {formatCurrency(Number(amount))}.
                </p>
                <div className="space-y-4">
                  {securityCodes.map((code, i) => (
                    <div key={code.id} className="p-4 rounded-xl bg-ink-900/60 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-gold-400/20 flex items-center justify-center font-display font-bold text-gold-300 text-sm">{i + 1}</div>
                        <span className="text-sm font-medium text-white">Section {i + 1}</span>
                        {codeInputs[i] && codeInputs[i] === code.code_digits && <Check className="w-4 h-4 text-emerald2-400 ml-auto" />}
                      </div>
                      <div className="mb-3">
                        <div className="label mb-1 block">Writeup</div>
                        <div className="text-sm text-gold-200 bg-gold-400/5 rounded-lg px-3 py-2 border border-gold-400/10">{code.writeup}</div>
                      </div>
                      <div>
                        <label className="label mb-1 block">Enter 4-digit code</label>
                        <input
                          type="text" inputMode="numeric" maxLength={4} value={codeInputs[i]}
                          onChange={(e) => handleCodeInput(i, e.target.value)} placeholder="••••"
                          className={`input-field font-mono tracking-[0.5em] text-center text-lg ${
                            codeInputs[i] && codeInputs[i] !== code.code_digits ? 'border-rose2-500/40' : codeInputs[i] === code.code_digits ? 'border-emerald2-500/40' : ''
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  {codeError && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{codeError}</div>}
                  <div className="flex gap-3">
                    <button onClick={() => setStep('details')} className="btn-ghost flex-1">Back</button>
                    <button onClick={handleSecurityCodeSubmit} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                      {loading ? 'Processing…' : 'Authorize'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'done' && (
              <div className="text-center py-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald2-500/20 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-emerald2-400" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">Transaction successful</h3>
                <p className="text-gray-400 text-sm mb-6">{formatCurrency(Number(amount))} {modalAction === 'transfer' ? 'sent' : modalAction === 'withdraw' ? 'withdrawn' : 'added'}.</p>
                <button onClick={() => { closeModal(); onRefresh(); }} className="btn-primary w-full">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
