import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Account, Card, Transaction, Loan, CryptoHolding, Message, SecurityCode, AdminSettings, SavingsAccount, BillPayment } from '@/lib/supabase';
import { formatCurrency, formatDate, maskAccount } from '@/lib/utils';
import {
  LogOut, Wallet, CreditCard, ArrowUpDown, Bitcoin, Coins,
  MessageSquare, Plus, ArrowUpRight, ArrowDownLeft, Send,
  TrendingUp, Snowflake, Snowflake as Freeze, Settings as SettingsIcon,
  Shield, Check, Zap, Tv, Receipt, PiggyBank, Download, Trash2,
  FileText, User, ArrowLeftRight, History,
} from 'lucide-react';

import AccountsTab from '@/components/dashboard/AccountsTab';
import CardsTab from '@/components/dashboard/CardsTab';
import CryptoTab from '@/components/dashboard/CryptoTab';
import LoansTab from '@/components/dashboard/LoansTab';
import MessagesTab from '@/components/dashboard/MessagesTab';
import SavingsTab from '@/components/dashboard/SavingsTab';
import BillsTab from '@/components/dashboard/BillsTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import SettingsTab from '@/components/dashboard/SettingsTab';

type Tab = 'overview' | 'accounts' | 'cards' | 'crypto' | 'loans' | 'savings' | 'bills' | 'history' | 'messages' | 'settings';

export default function CustomerDashboard() {
  const { customer, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [bills, setBills] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    const { data: accts } = await supabase.from('accounts').select('*').eq('customer_id', customer.id);
    setAccounts(accts || []);

    const { data: crds } = await supabase.from('cards').select('*').eq('customer_id', customer.id);
    setCards(crds || []);

    if (accts && accts.length > 0) {
      const acctIds = accts.map((a) => a.id);
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .in('account_id', acctIds)
        .order('created_at', { ascending: false });
      setTransactions(txns || []);
    } else {
      setTransactions([]);
    }

    const { data: lns } = await supabase.from('loans').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    setLoans(lns || []);

    const { data: hld } = await supabase.from('crypto_holdings').select('*').eq('customer_id', customer.id);
    setHoldings(hld || []);

    const { data: msgs } = await supabase.from('messages').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    setMessages(msgs || []);

    const { data: sav } = await supabase.from('savings_accounts').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    setSavings(sav || []);

    const { data: bls } = await supabase.from('bill_payments').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    setBills(bls || []);

    setLoading(false);
  }, [customer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const cryptoValue = holdings.reduce((s, h) => {
    const price = CRYPTO_PRICES[h.symbol] || 0;
    return s + Number(h.amount) * price;
  }, 0);

  const navItems: { key: Tab; label: string; icon: typeof Wallet }[] = [
    { key: 'overview', label: 'Overview', icon: Wallet },
    { key: 'accounts', label: 'Accounts', icon: ArrowUpDown },
    { key: 'cards', label: 'Cards', icon: CreditCard },
    { key: 'crypto', label: 'Crypto', icon: Bitcoin },
    { key: 'loans', label: 'Loans', icon: Coins },
    { key: 'savings', label: 'Savings', icon: PiggyBank },
    { key: 'bills', label: 'Bills', icon: Zap },
    { key: 'history', label: 'History', icon: History },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="glass border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow-gold">
              <span className="font-display font-extrabold text-ink-950 text-sm">A</span>
            </div>
            <div>
              <span className="font-display font-bold text-white">Alliance Global</span>
              <span className="text-[10px] text-gold-400/80 tracking-[0.2em] uppercase ml-2">Bank Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm text-white font-medium">{customer?.full_name}</div>
              <div className="text-xs text-gray-500">{customer?.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-display font-bold text-ink-950">
              {customer?.profile_picture ? (
                <img src={customer.profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                customer?.full_name?.[0]
              )}
            </div>
            <button onClick={signOut} className="text-gray-400 hover:text-rose2-400 transition-colors p-2" title="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <nav className="glass-card p-3 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  tab === item.key
                    ? 'bg-gold-400/15 text-gold-200 border border-gold-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.key === 'messages' && unreadCount > 0 && (
                  <span className="ml-auto bg-gold-400 text-ink-950 text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <OverviewTab
                  totalBalance={totalBalance}
                  cryptoValue={cryptoValue}
                  accounts={accounts}
                  cards={cards}
                  transactions={transactions}
                  customerName={customer?.full_name || ''}
                  customerId={customer?.id || ''}
                  onNavigate={setTab}
                />
              )}
              {tab === 'accounts' && <AccountsTab accounts={accounts} transactions={transactions} onRefresh={loadData} />}
              {tab === 'cards' && <CardsTab cards={cards} accounts={accounts} onRefresh={loadData} />}
              {tab === 'crypto' && <CryptoTab holdings={holdings} accounts={accounts} onRefresh={loadData} />}
              {tab === 'loans' && <LoansTab loans={loans} onRefresh={loadData} />}
              {tab === 'savings' && <SavingsTab savings={savings} accounts={accounts} onRefresh={loadData} />}
              {tab === 'bills' && <BillsTab bills={bills} accounts={accounts} onRefresh={loadData} />}
              {tab === 'history' && <HistoryTab transactions={transactions} accounts={accounts} onRefresh={loadData} />}
              {tab === 'messages' && <MessagesTab messages={messages} onRefresh={loadData} />}
              {tab === 'settings' && <SettingsTab onRefresh={loadData} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export const CRYPTO_PRICES: Record<string, number> = {
  BTC: 64210.5, ETH: 3512.8, SOL: 168.2, USDC: 1.0, XRP: 0.62, ADA: 0.48,
};

/* ---------- Overview ---------- */
function OverviewTab({
  totalBalance, cryptoValue, accounts, cards, transactions, customerName, customerId, onNavigate,
}: {
  totalBalance: number;
  cryptoValue: number;
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  customerName: string;
  customerId: string;
  onNavigate: (tab: Tab) => void;
}) {
  const recentTx = transactions.slice(0, 6);
  const primaryAccount = accounts[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-1">
          Welcome back, {customerName.split(' ')[0]}
        </h1>
        <p className="text-gray-500">Here's your financial snapshot.</p>
      </div>

      {/* Balance hero with both account and crypto balance */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="label mb-2">Account balance</div>
              <div className="font-display font-extrabold text-4xl text-gradient-gold mb-2">
                {formatCurrency(totalBalance)}
              </div>
              {primaryAccount && (
                <div className="font-mono text-xs text-gray-500">Account No: {primaryAccount.account_number}</div>
              )}
            </div>
            <div>
              <div className="label mb-2 flex items-center gap-2">
                <Bitcoin className="w-3.5 h-3.5" /> Crypto balance
              </div>
              <div className="font-display font-extrabold text-4xl text-emerald2-400 mb-2">
                {formatCurrency(cryptoValue)}
              </div>
              <div className="text-xs text-gray-500">Portfolio value</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/5">
            <div>
              <div className="text-xs text-gray-500 mb-1">Accounts</div>
              <div className="font-display font-bold text-xl text-white">{accounts.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Cards</div>
              <div className="font-display font-bold text-xl text-white">{cards.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total assets</div>
              <div className="font-display font-bold text-xl text-white">{formatCurrency(totalBalance + cryptoValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => onNavigate('accounts')} className="glass-card p-4 text-center hover:-translate-y-0.5 transition-all">
          <Send className="w-5 h-5 text-gold-400 mx-auto mb-2" />
          <div className="text-xs text-white font-medium">Transfer</div>
        </button>
        <button onClick={() => onNavigate('bills')} className="glass-card p-4 text-center hover:-translate-y-0.5 transition-all">
          <Zap className="w-5 h-5 text-gold-400 mx-auto mb-2" />
          <div className="text-xs text-white font-medium">Pay Bills</div>
        </button>
        <button onClick={() => onNavigate('crypto')} className="glass-card p-4 text-center hover:-translate-y-0.5 transition-all">
          <Bitcoin className="w-5 h-5 text-gold-400 mx-auto mb-2" />
          <div className="text-xs text-white font-medium">Trade Crypto</div>
        </button>
        <button onClick={() => onNavigate('savings')} className="glass-card p-4 text-center hover:-translate-y-0.5 transition-all">
          <PiggyBank className="w-5 h-5 text-gold-400 mx-auto mb-2" />
          <div className="text-xs text-white font-medium">Savings</div>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-white mb-4">Recent activity</h3>
          {recentTx.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-rose2-500/15 text-rose2-400'
                  }`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-0">
                    <div className="text-sm text-white font-medium truncate">{tx.narration || tx.description || tx.type}</div>
                    <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
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

        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-white mb-4">Your cards</h3>
          {cards.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No cards yet.</p>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="p-4 rounded-xl bg-gradient-to-br from-ink-700 to-ink-900 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gold-400 uppercase tracking-wider">{card.type} card</span>
                    <span className={`chip ${card.status === 'active' ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-rose2-500/15 text-rose2-400'}`}>
                      {card.status}
                    </span>
                  </div>
                  <div className="font-mono text-white tracking-wider">•••• {card.card_number_last4}</div>
                  <div className="text-xs text-gray-500 mt-1">{card.card_holder}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
