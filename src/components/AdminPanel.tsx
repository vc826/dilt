import { useState, useEffect, useCallback } from 'react';
import { supabase, Customer, Account, Card, AccountApplication, Loan, Message, SecurityCode, AdminSettings, Transaction } from '@/lib/supabase';
import { formatCurrency, formatDate, formatDateTime, generateAccountNumber, generateCardLast4, simpleHash } from '@/lib/utils';
import AdminLogin from '@/components/AdminLogin';
import { notifyEmail } from '@/lib/email';
import {
  Shield, LayoutDashboard, FileText, Users, MessageSquare, LogOut,
  Check, X, Eye, TrendingUp, Wallet, Clock, Search, KeyRound, Lock,
  Trash2, Ban, RefreshCw, Settings, CreditCard, Coins, Plus, Minus, Calendar,
} from 'lucide-react';

const ADMIN_STORAGE = 'agb_admin_session';

type AdminTab = 'dashboard' | 'applications' | 'customers' | 'loans' | 'cards' | 'messages' | 'settings';

async function sendSystemMessage(customerId: string, body: string) {
  await supabase.from('messages').insert({
    customer_id: customerId,
    sender: 'admin',
    body,
    read: false,
  });
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ADMIN_STORAGE) === '1') setAuthed(true);
  }, []);

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return <AdminShell onLogout={() => { setAuthed(false); localStorage.removeItem(ADMIN_STORAGE); }} />;
}

function AdminShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const navItems: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'applications', label: 'Applications', icon: FileText },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'loans', label: 'Loans', icon: Coins },
    { key: 'cards', label: 'Card Requests', icon: CreditCard },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="glass border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow-gold">
              <Shield className="w-5 h-5 text-ink-950" strokeWidth={2} />
            </div>
            <div>
              <span className="font-display font-bold text-white">Alliance Global</span>
              <span className="text-[10px] text-gold-400/80 tracking-[0.2em] uppercase ml-2">Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-rose2-400 transition-colors p-2" title="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
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
              </button>
            ))}
          </nav>
        </aside>

        <main>
          {tab === 'dashboard' && <AdminDashboardTab />}
          {tab === 'applications' && <ApplicationsTab />}
          {tab === 'customers' && <CustomersTab />}
          {tab === 'loans' && <LoansTabAdmin />}
          {tab === 'cards' && <CardRequestsTab />}
          {tab === 'messages' && <AdminMessagesTab />}
          {tab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function AdminDashboardTab() {
  const [stats, setStats] = useState({
    customers: 0, accounts: 0, pendingApps: 0, totalAssets: 0, pendingLoans: 0, pendingCards: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: customers }, { count: accounts }, { data: pendingApps }, { data: accts }, { data: pendingLoans }, { data: pendingCards }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('accounts').select('*', { count: 'exact', head: true }),
        supabase.from('account_applications').select('*').eq('status', 'pending'),
        supabase.from('accounts').select('balance'),
        supabase.from('loans').select('*').eq('status', 'pending'),
        supabase.from('cards').select('*').eq('status', 'pending'),
      ]);
      const totalAssets = (accts || []).reduce((s, a: any) => s + Number(a.balance), 0);
      setStats({
        customers: customers || 0,
        accounts: accounts || 0,
        pendingApps: pendingApps?.length || 0,
        totalAssets,
        pendingLoans: pendingLoans?.length || 0,
        pendingCards: pendingCards?.length || 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Total customers', value: stats.customers.toString(), icon: Users, color: 'text-gold-400' },
    { label: 'Total accounts', value: stats.accounts.toString(), icon: Wallet, color: 'text-emerald2-400' },
    { label: 'Assets under mgmt', value: formatCurrency(stats.totalAssets), icon: TrendingUp, color: 'text-gold-300' },
    { label: 'Pending applications', value: stats.pendingApps.toString(), icon: Clock, color: 'text-rose2-400' },
    { label: 'Pending loans', value: stats.pendingLoans.toString(), icon: Coins, color: 'text-emerald2-400' },
    { label: 'Pending card requests', value: stats.pendingCards.toString(), icon: CreditCard, color: 'text-gold-300' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm">Alliance Global Bank overview at a glance.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <div className="font-display font-extrabold text-3xl text-white mb-1">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Applications ---------- */
function ApplicationsTab() {
  const [apps, setApps] = useState<AccountApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('account_applications').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setApps(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (app: AccountApplication) => {
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        email: app.email,
        full_name: app.full_name,
        password_hash: app.password_hash,
        status: 'active',
      })
      .select()
      .single();
    if (custErr) { alert('Customer may already exist: ' + custErr.message); return; }

    const { data: account } = await supabase
      .from('accounts')
      .insert({
        customer_id: customer.id,
        account_number: generateAccountNumber(),
        type: app.account_type,
        balance: app.initial_deposit,
      })
      .select()
      .single();

    if (account) {
      await supabase.from('transactions').insert({
        account_id: account.id,
        type: 'deposit',
        amount: app.initial_deposit,
        description: 'Initial deposit',
        counterparty: 'Alliance Global Bank',
      });
      const now = new Date();
      await supabase.from('cards').insert({
        customer_id: customer.id,
        account_id: account.id,
        card_number_last4: generateCardLast4(),
        card_holder: app.full_name.toUpperCase(),
        expiry_month: now.getMonth() + 1,
        expiry_year: now.getFullYear() + 4,
        type: 'debit',
        status: 'active',
      });
    }

    await supabase.from('account_applications').update({ status: 'approved' }).eq('id', app.id);
    const msg = `Welcome to Alliance Global Bank! Your application has been approved. Your ${app.account_type} account is now active. A debit card has been issued to you. You can now sign in to your account.`;
    await sendSystemMessage(customer.id, msg);
    await notifyEmail(app.email, 'Account Approved - Alliance Global Bank', msg);
    load();
  };

  const handleReject = async (app: AccountApplication) => {
    await supabase.from('account_applications').update({ status: 'rejected' }).eq('id', app.id);
    const { data: cust } = await supabase.from('customers').select('id').eq('email', app.email).maybeSingle();
    const msg = `Your account application has been rejected. If you believe this is an error, please contact Alliance Global Bank support for assistance.`;
    if (cust) await sendSystemMessage(cust.id, msg);
    await notifyEmail(app.email, 'Application Update - Alliance Global Bank', msg);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Applications</h1>
        <p className="text-gray-500 text-sm">Review and process account applications.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-gold-400/15 text-gold-200 border border-gold-400/20' : 'text-gray-400 hover:text-white border border-transparent'
            }`}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>
      ) : apps.length === 0 ? (
        <div className="glass-card p-12 text-center"><FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No applications found.</p></div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-lg text-white">{app.full_name}</span>
                    <span className={`chip ${
                      app.status === 'approved' ? 'bg-emerald2-500/15 text-emerald2-400' :
                      app.status === 'rejected' ? 'bg-rose2-500/15 text-rose2-400' : 'bg-gold-400/15 text-gold-300'
                    }`}>{app.status}</span>
                  </div>
                  <div className="text-sm text-gray-400">{app.email} · {app.phone}</div>
                  <div className="text-xs text-gray-600 mt-1">{app.account_type} · {formatCurrency(app.initial_deposit)} · {formatDate(app.created_at)}</div>
                  <div className="text-xs text-gray-600">{app.address}</div>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(app)} className="btn-danger text-sm py-2 px-3"><X className="w-4 h-4" /> Reject</button>
                    <button onClick={() => handleApprove(app)} className="btn-primary text-sm py-2 px-3"><Check className="w-4 h-4" /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Customers (with credit/debit) ---------- */
function CustomersTab() {
  const [customers, setCustomers] = useState<(Customer & { accounts?: Account[]; cards?: Card[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // credit/debit modal state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txAccount, setTxAccount] = useState<Account | null>(null);
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txTime, setTxTime] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: custs } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (!custs) { setLoading(false); return; }
    const enriched = await Promise.all(
      custs.map(async (c) => {
        const [{ data: accts }, { data: crds }] = await Promise.all([
          supabase.from('accounts').select('*').eq('customer_id', c.id),
          supabase.from('cards').select('*').eq('customer_id', c.id),
        ]);
        return { ...c, accounts: accts || [], cards: crds || [] };
      })
    );
    setCustomers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async (cust: Customer) => {
    setActionLoading(cust.id);
    await supabase.from('customers').update({ status: 'frozen' }).eq('id', cust.id);
    const msg = 'Your account has been suspended by Alliance Global Bank administration. Please contact support for more information.';
    await sendSystemMessage(cust.id, msg);
    await notifyEmail(cust.email, 'Account Suspended - Alliance Global Bank', msg);
    setCustomers((p) => p.map((c) => c.id === cust.id ? { ...c, status: 'frozen' } : c));
    setActionLoading(null);
  };

  const handleReactivate = async (cust: Customer) => {
    setActionLoading(cust.id);
    await supabase.from('customers').update({ status: 'active' }).eq('id', cust.id);
    const msg = 'Your account has been reactivated. You now have full access to your Alliance Global Bank services.';
    await sendSystemMessage(cust.id, msg);
    await notifyEmail(cust.email, 'Account Reactivated - Alliance Global Bank', msg);
    setCustomers((p) => p.map((c) => c.id === cust.id ? { ...c, status: 'active' } : c));
    setActionLoading(null);
  };

  const handleDelete = async (cust: Customer) => {
    if (!confirm(`Delete ${cust.full_name}? This will permanently remove the customer and all associated accounts, cards, and transactions.`)) return;
    setActionLoading(cust.id);
    await supabase.from('customers').delete().eq('id', cust.id);
    const msg = 'Your Alliance Global Bank account has been permanently closed. Contact support if this was unexpected.';
    await notifyEmail(cust.email, 'Account Closed - Alliance Global Bank', msg);
    setCustomers((p) => p.filter((c) => c.id !== cust.id));
    setSelected(null);
    setActionLoading(null);
  };

  const openTxModal = (account: Account, type: 'credit' | 'debit') => {
    setTxAccount(account);
    setTxType(type);
    setTxAmount('');
    setTxDesc('');
    const now = new Date();
    setTxDate(now.toISOString().slice(0, 10));
    setTxTime(now.toTimeString().slice(0, 5));
    setShowTxModal(true);
  };

  const handleTxSubmit = async () => {
    if (!txAccount) return;
    const amt = parseFloat(txAmount);
    if (!amt || amt <= 0) { alert('Enter a valid amount.'); return; }

    const cust = customers.find((c) => c.accounts?.some((a) => a.id === txAccount.id));
    setTxLoading(true);

    let newBalance = Number(txAccount.balance);
    if (txType === 'credit') {
      newBalance += amt;
    } else {
      newBalance -= amt;
    }

    await supabase.from('accounts').update({ balance: newBalance }).eq('id', txAccount.id);

    const customTimestamp = `${txDate}T${txTime}:00`;
    await supabase.from('transactions').insert({
      account_id: txAccount.id,
      type: txType === 'credit' ? 'deposit' : 'withdrawal',
      amount: amt,
      description: txDesc || (txType === 'credit' ? 'Admin credit' : 'Admin debit'),
      counterparty: 'Alliance Global Bank Admin',
      narration: txDesc,
      created_at: customTimestamp,
    });

    if (cust) {
      const action = txType === 'credit' ? 'credited to' : 'debited from';
      const msg = `${formatCurrency(amt)} has been ${action} your account (•••• ${txAccount.account_number.slice(-4)}). Description: ${txDesc || 'N/A'}. Date: ${formatDateTime(customTimestamp)}`;
      await sendSystemMessage(cust.id, msg);
      await notifyEmail(cust.email, `${txType === 'credit' ? 'Credit' : 'Debit'} Alert - Alliance Global Bank`, msg);
    }

    setTxLoading(false);
    setShowTxModal(false);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Customers</h1>
        <p className="text-gray-500 text-sm">Manage customer accounts — suspend, delete, credit or debit.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="input-field pl-10" />
      </div>
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center"><Users className="w-12 h-12 text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No customers found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const totalBalance = (c.accounts || []).reduce((s, a) => s + Number(a.balance), 0);
            const isExpanded = selected === c.id;
            const busy = actionLoading === c.id;
            return (
              <div key={c.id} className="glass-card overflow-hidden">
                <button onClick={() => setSelected(isExpanded ? null : c.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-display font-bold text-ink-950">{c.full_name[0]}</div>
                    <div>
                      <div className="font-display font-semibold text-white">{c.full_name}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="font-display font-bold text-white">{formatCurrency(totalBalance)}</div>
                      <div className="text-xs text-gray-500">{c.accounts?.length || 0} accounts</div>
                    </div>
                    <span className={`chip ${c.status === 'active' ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-rose2-500/15 text-rose2-400'}`}>{c.status}</span>
                    <Eye className="w-4 h-4 text-gray-600" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-4 animate-fade-in">
                    <div>
                      <h4 className="label mb-2">Accounts</h4>
                      {c.accounts && c.accounts.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {c.accounts.map((a) => (
                            <div key={a.id} className="p-3 rounded-xl bg-ink-900/60 border border-white/5">
                              <div className="text-xs text-gold-400 uppercase">{a.type}</div>
                              <div className="font-display font-bold text-white">{formatCurrency(Number(a.balance))}</div>
                              <div className="font-mono text-xs text-gray-500">•••• {a.account_number.slice(-4)}</div>
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => openTxModal(a, 'credit')} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald2-500/10 text-emerald2-400 hover:bg-emerald2-500/20 transition-all">
                                  <Plus className="w-3 h-3" /> Credit
                                </button>
                                <button onClick={() => openTxModal(a, 'debit')} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose2-500/10 text-rose2-400 hover:bg-rose2-500/20 transition-all">
                                  <Minus className="w-3 h-3" /> Debit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500">No accounts.</p>}
                    </div>

                    <div>
                      <h4 className="label mb-2">Cards</h4>
                      {c.cards && c.cards.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {c.cards.map((card) => (
                            <span key={card.id} className={`chip ${card.status === 'pending' ? 'bg-gold-400/15 text-gold-300' : 'bg-ink-700 text-gray-300'}`}>
                              {card.type} · •••• {card.card_number_last4} · {card.status}
                            </span>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-500">No cards.</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div className="text-xs text-gray-600">Joined {formatDate(c.created_at)}</div>
                      <div className="flex gap-2">
                        {c.status === 'active' ? (
                          <button onClick={() => handleSuspend(c)} disabled={busy}
                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl bg-rose2-500/10 text-rose2-400 hover:bg-rose2-500/20 transition-all disabled:opacity-50">
                            <Ban className="w-4 h-4" /> Suspend
                          </button>
                        ) : (
                          <button onClick={() => handleReactivate(c)} disabled={busy}
                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl bg-emerald2-500/10 text-emerald2-400 hover:bg-emerald2-500/20 transition-all disabled:opacity-50">
                            <RefreshCw className="w-4 h-4" /> Reactivate
                          </button>
                        )}
                        <button onClick={() => handleDelete(c)} disabled={busy}
                          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl bg-rose2-500/10 text-rose2-400 hover:bg-rose2-500/20 transition-all disabled:opacity-50">
                          {busy ? <div className="w-4 h-4 border-2 border-rose2-400/30 border-t-rose2-400 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Credit/Debit modal */}
      {showTxModal && txAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowTxModal(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1 capitalize">{txType} account</h3>
            <p className="text-sm text-gray-500 mb-5">Account •••• {txAccount.account_number.slice(-4)} · Current balance: {formatCurrency(Number(txAccount.balance))}</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Amount</label>
                <input type="number" min="0.01" step="0.01" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className="label mb-1.5 block">Description / Narration</label>
                <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="e.g. Wire transfer received" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block">Time</label>
                  <input type="time" value={txTime} onChange={(e) => setTxTime(e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTxModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleTxSubmit} disabled={txLoading} className="btn-primary flex-1 disabled:opacity-50">
                  {txLoading ? 'Processing…' : `Confirm ${txType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Loans Admin ---------- */
function LoansTabAdmin() {
  const [loans, setLoans] = useState<(Loan & { customer_name?: string; customer_email?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('loans').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    if (!data) { setLoading(false); return; }
    const enriched = await Promise.all(
      data.map(async (loan) => {
        const { data: cust } = await supabase.from('customers').select('full_name, email').eq('id', loan.customer_id).maybeSingle();
        return { ...loan, customer_name: cust?.full_name || 'Unknown', customer_email: cust?.email || '' };
      })
    );
    setLoans(enriched);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (loan: Loan & { customer_name?: string; customer_email?: string }) => {
    await supabase.from('loans').update({ status: 'approved' }).eq('id', loan.id);
    // credit the customer's first account with the loan amount
    const { data: accounts } = await supabase.from('accounts').select('*').eq('customer_id', loan.customer_id).order('created_at', { ascending: true });
    if (accounts && accounts.length > 0) {
      const acct = accounts[0];
      const newBal = Number(acct.balance) + Number(loan.amount);
      await supabase.from('accounts').update({ balance: newBal }).eq('id', acct.id);
      await supabase.from('transactions').insert({
        account_id: acct.id,
        type: 'deposit',
        amount: Number(loan.amount),
        description: `Loan approved - ${loan.interest_rate}% APR, ${loan.term_months} months`,
        counterparty: 'Alliance Global Bank',
        narration: 'Loan disbursement',
      });
    }
    const msg = `Your loan application for ${formatCurrency(Number(loan.amount))} has been approved! The funds have been credited to your account. Loan terms: ${loan.interest_rate}% APR over ${loan.term_months} months.`;
    await sendSystemMessage(loan.customer_id, msg);
    await notifyEmail(loan.customer_email, 'Loan Approved - Alliance Global Bank', msg);
    load();
  };

  const handleReject = async (loan: Loan & { customer_name?: string; customer_email?: string }) => {
    await supabase.from('loans').update({ status: 'rejected' }).eq('id', loan.id);
    const msg = `Your loan application for ${formatCurrency(Number(loan.amount))} has been declined. Please contact Alliance Global Bank for more information.`;
    await sendSystemMessage(loan.customer_id, msg);
    await notifyEmail(loan.customer_email, 'Loan Update - Alliance Global Bank', msg);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Loans</h1>
        <p className="text-gray-500 text-sm">Approve or decline customer loan applications.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected', 'active'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-gold-400/15 text-gold-200 border border-gold-400/20' : 'text-gray-400 hover:text-white border border-transparent'
            }`}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>
      ) : loans.length === 0 ? (
        <div className="glass-card p-12 text-center"><Coins className="w-12 h-12 text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No loans found.</p></div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-2xl text-white">{formatCurrency(Number(loan.amount))}</span>
                    <span className={`chip ${
                      loan.status === 'approved' || loan.status === 'active' ? 'bg-emerald2-500/15 text-emerald2-400' :
                      loan.status === 'rejected' ? 'bg-rose2-500/15 text-rose2-400' : 'bg-gold-400/15 text-gold-300'
                    }`}>{loan.status}</span>
                  </div>
                  <div className="text-sm text-gray-400">{loan.customer_name}</div>
                  <div className="text-xs text-gray-600 mt-1">{loan.interest_rate}% APR · {loan.term_months} months · Applied {formatDate(loan.created_at)}</div>
                </div>
                {loan.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(loan)} className="btn-danger text-sm py-2 px-3"><X className="w-4 h-4" /> Decline</button>
                    <button onClick={() => handleApprove(loan)} className="btn-primary text-sm py-2 px-3"><Check className="w-4 h-4" /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Card Requests Admin ---------- */
function CardRequestsTab() {
  const [cards, setCards] = useState<(Card & { customer_name?: string; customer_email?: string; account_number?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'blocked'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    if (!data) { setLoading(false); return; }
    const enriched = await Promise.all(
      data.map(async (card) => {
        const { data: cust } = await supabase.from('customers').select('full_name, email').eq('id', card.customer_id).maybeSingle();
        const { data: acct } = await supabase.from('accounts').select('account_number').eq('id', card.account_id).maybeSingle();
        return { ...card, customer_name: cust?.full_name || 'Unknown', customer_email: cust?.email || '', account_number: acct?.account_number || '' };
      })
    );
    setCards(enriched);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (card: Card & { customer_name?: string; customer_email?: string }) => {
    await supabase.from('cards').update({ status: 'active' }).eq('id', card.id);
    const msg = `Your ${card.type} card request has been approved! Your card (•••• ${card.card_number_last4}) is now active and ready for use.`;
    await sendSystemMessage(card.customer_id, msg);
    await notifyEmail(card.customer_email, 'Card Approved - Alliance Global Bank', msg);
    load();
  };

  const handleDecline = async (card: Card & { customer_name?: string; customer_email?: string }) => {
    await supabase.from('cards').delete().eq('id', card.id);
    const msg = `Your ${card.type} card request has been declined. Please contact Alliance Global Bank for more information.`;
    await sendSystemMessage(card.customer_id, msg);
    await notifyEmail(card.customer_email, 'Card Update - Alliance Global Bank', msg);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Card Requests</h1>
        <p className="text-gray-500 text-sm">Approve or decline customer card requests.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'active', 'blocked', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-gold-400/15 text-gold-200 border border-gold-400/20' : 'text-gray-400 hover:text-white border border-transparent'
            }`}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>
      ) : cards.length === 0 ? (
        <div className="glass-card p-12 text-center"><CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" /><p className="text-gray-500">No card requests found.</p></div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-gold-400" />
                    <span className="font-display font-bold text-lg text-white capitalize">{card.type} Card</span>
                    <span className={`chip ${card.status === 'active' ? 'bg-emerald2-500/15 text-emerald2-400' : card.status === 'blocked' ? 'bg-rose2-500/15 text-rose2-400' : 'bg-gold-400/15 text-gold-300'}`}>{card.status}</span>
                  </div>
                  <div className="text-sm text-gray-400">{card.customer_name}</div>
                  <div className="text-xs text-gray-600 mt-1">•••• {card.card_number_last4} · {card.card_holder} · Linked: •••• {card.account_number.slice(-4)} · {formatDate(card.created_at)}</div>
                </div>
                {card.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecline(card)} className="btn-danger text-sm py-2 px-3"><X className="w-4 h-4" /> Decline</button>
                    <button onClick={() => handleApprove(card)} className="btn-primary text-sm py-2 px-3"><Check className="w-4 h-4" /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Admin Messages ---------- */
function AdminMessagesTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCust, setSelectedCust] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('customers').select('*').order('full_name');
      setCustomers(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCust) return;
    (async () => {
      const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedCust).order('created_at', { ascending: true });
      setMessages(data || []);
      await supabase.from('messages').update({ read: true }).eq('customer_id', selectedCust).eq('sender', 'customer');
    })();
  }, [selectedCust]);

  const handleSend = async () => {
    if (!selectedCust || !body.trim()) return;
    await supabase.from('messages').insert({ customer_id: selectedCust, sender: 'admin', body: body.trim(), read: false });
    const cust = customers.find((c) => c.id === selectedCust);
    if (cust) await notifyEmail(cust.email, 'New message from Alliance Global Bank', body.trim());
    setBody('');
    const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedCust).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Messages</h1>
        <p className="text-gray-500 text-sm">Support conversations with customers.</p>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[60vh]">
        <div className="glass-card p-3 overflow-y-auto scrollbar-hide">
          {customers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No customers yet.</p>
          ) : (
            customers.map((c) => (
              <button key={c.id} onClick={() => setSelectedCust(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${
                  selectedCust === c.id ? 'bg-gold-400/15 border border-gold-400/20' : 'hover:bg-white/5 border border-transparent'
                }`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-display font-bold text-ink-950 text-sm">{c.full_name[0]}</div>
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">{c.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">{c.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="glass-card p-4 flex flex-col">
          {!selectedCust ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center"><MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">Select a customer to view messages.</p></div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide mb-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender === 'admin' ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 rounded-br-sm' : 'bg-ink-700 text-white rounded-bl-sm'
                      }`}>
                        {msg.body}
                        <div className={`text-[10px] mt-1 ${msg.sender === 'admin' ? 'text-ink-950/60' : 'text-gray-500'}`}>{formatDate(msg.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 border-t border-white/5 pt-3">
                <input type="text" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Reply…" className="input-field flex-1" />
                <button onClick={handleSend} disabled={!body.trim()} className="btn-primary px-4 disabled:opacity-50">Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Settings: Security Codes + Admin Password ---------- */
function SettingsTab() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [codesEnabled, setCodesEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingCodes, setExistingCodes] = useState<SecurityCode[]>([]);
  const [codeSections, setCodeSections] = useState([
    { writeup: '', code_digits: '' }, { writeup: '', code_digits: '' }, { writeup: '', code_digits: '' }, { writeup: '', code_digits: '' },
  ]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('admin_settings').select('*').eq('id', 1).maybeSingle();
      if (s) { setSettings(s as AdminSettings); setCodesEnabled((s as AdminSettings).security_codes_enabled); }
      const { data: custs } = await supabase.from('customers').select('*').order('full_name');
      setCustomers(custs || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCustId) { setExistingCodes([]); return; }
    (async () => {
      const { data } = await supabase.from('security_codes').select('*').eq('customer_id', selectedCustId).order('section_number', { ascending: true });
      const codes = data || [];
      setExistingCodes(codes as SecurityCode[]);
      const sections = [1, 2, 3, 4].map((n) => {
        const existing = codes.find((c: any) => c.section_number === n);
        return { writeup: existing?.writeup || '', code_digits: existing?.code_digits || '' };
      });
      setCodeSections(sections);
      setCodeMsg(null);
    })();
  }, [selectedCustId]);

  const handleToggleCodes = async () => {
    setToggleLoading(true);
    const newVal = !codesEnabled;
    await supabase.from('admin_settings').update({ security_codes_enabled: newVal }).eq('id', 1);
    setCodesEnabled(newVal);
    setToggleLoading(false);
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (!curPw || !newPw || !confirmPw) { setPwMsg({ type: 'err', text: 'Fill in all fields.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 4) { setPwMsg({ type: 'err', text: 'Password must be at least 4 characters.' }); return; }
    setPwLoading(true);
    const storedHash = settings?.admin_password_hash;
    const defaultPw = 'wixxy.Alliance111@';
    if (storedHash === 'seed') {
      if (curPw !== defaultPw) { setPwMsg({ type: 'err', text: 'Current password is incorrect.' }); setPwLoading(false); return; }
    } else if (storedHash !== simpleHash(curPw)) {
      setPwMsg({ type: 'err', text: 'Current password is incorrect.' }); setPwLoading(false); return;
    }
    const newHash = simpleHash(newPw);
    await supabase.from('admin_settings').update({ admin_password_hash: newHash }).eq('id', 1);
    setSettings((p) => p ? { ...p, admin_password_hash: newHash } : p);
    setPwMsg({ type: 'ok', text: 'Admin password changed successfully.' });
    setCurPw(''); setNewPw(''); setConfirmPw('');
    setPwLoading(false);
  };

  const handleSaveCodes = async () => {
    if (!selectedCustId) return;
    setCodeMsg(null);
    for (let i = 0; i < 4; i++) {
      if (!codeSections[i].writeup.trim()) { setCodeMsg({ type: 'err', text: `Section ${i + 1}: writeup is required.` }); return; }
      if (codeSections[i].code_digits.length !== 4 || !/^\d{4}$/.test(codeSections[i].code_digits)) {
        setCodeMsg({ type: 'err', text: `Section ${i + 1}: code must be exactly 4 digits.` }); return;
      }
    }
    setCodeLoading(true);
    const custId = selectedCustId;
    const custName = customers.find((c) => c.id === custId)?.full_name || 'your account';
    for (let i = 0; i < 4; i++) {
      const section = i + 1;
      const existing = existingCodes.find((c) => c.section_number === section);
      if (existing) {
        await supabase.from('security_codes').update({ writeup: codeSections[i].writeup.trim(), code_digits: codeSections[i].code_digits }).eq('id', existing.id);
      } else {
        await supabase.from('security_codes').insert({ customer_id: custId, section_number: section, writeup: codeSections[i].writeup.trim(), code_digits: codeSections[i].code_digits });
      }
    }
    await sendSystemMessage(custId, `Transfer security codes have been assigned to your account. You will need to enter the 4-digit codes when making transfers.`);
    const cust = customers.find((c) => c.id === custId);
    if (cust) await notifyEmail(cust.email, 'Security Codes Assigned - Alliance Global Bank', 'Transfer security codes have been assigned to your account. You will need to enter the 4-digit codes when making transfers.');
    setCodeMsg({ type: 'ok', text: `Security codes saved for ${custName}. The customer has been notified.` });
    setCodeLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Admin password and transfer security codes.</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/15 flex items-center justify-center"><Shield className="w-5 h-5 text-gold-400" /></div>
            <div>
              <div className="font-display font-bold text-white">Transfer security codes</div>
              <div className="text-sm text-gray-500">When ON, customers with assigned codes must enter them to complete transfers.</div>
            </div>
          </div>
          <button onClick={handleToggleCodes} disabled={toggleLoading}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${codesEnabled ? 'bg-emerald2-500' : 'bg-ink-700'}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all duration-300 ${codesEnabled ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display font-bold text-white mb-1">Assign security codes</h3>
        <p className="text-sm text-gray-500 mb-5">Select a customer and assign 4 sections. Each section has a writeup and a 4-digit code.</p>
        <div className="mb-5">
          <label className="label mb-1.5 block">Customer</label>
          <select value={selectedCustId || ''} onChange={(e) => setSelectedCustId(e.target.value)} className="input-field">
            <option value="">Select a customer…</option>
            {customers.map((c) => (<option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>))}
          </select>
        </div>
        {selectedCustId && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => {
              const idx = n - 1;
              return (
                <div key={n} className="p-4 rounded-xl bg-ink-900/60 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gold-400/20 flex items-center justify-center font-display font-bold text-gold-300 text-sm">{n}</div>
                    <span className="text-sm font-medium text-white">Section {n}</span>
                    {existingCodes.find((c) => c.section_number === n) && <span className="chip bg-emerald2-500/15 text-emerald2-400 text-[10px]">Assigned</span>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label mb-1.5 block">Writeup (word/phrase)</label>
                      <input type="text" value={codeSections[idx].writeup} onChange={(e) => setCodeSections((p) => p.map((s, i) => i === idx ? { ...s, writeup: e.target.value } : s))} placeholder="e.g. Security key word" className="input-field" />
                    </div>
                    <div>
                      <label className="label mb-1.5 block">4-digit code</label>
                      <input type="text" inputMode="numeric" maxLength={4} value={codeSections[idx].code_digits}
                        onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setCodeSections((p) => p.map((s, i) => i === idx ? { ...s, code_digits: val } : s)); }}
                        placeholder="0000" className="input-field font-mono tracking-[0.5em] text-center" />
                    </div>
                  </div>
                </div>
              );
            })}
            {codeMsg && <div className={`p-3 rounded-xl text-sm ${codeMsg.type === 'ok' ? 'bg-emerald2-500/10 border border-emerald2-500/20 text-emerald2-400' : 'bg-rose2-500/10 border border-rose2-500/20 text-rose2-400'}`}>{codeMsg.text}</div>}
            <button onClick={handleSaveCodes} disabled={codeLoading} className="btn-primary disabled:opacity-50">{codeLoading ? 'Saving…' : 'Save security codes'}</button>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold-400/15 flex items-center justify-center"><KeyRound className="w-5 h-5 text-gold-400" /></div>
          <div>
            <div className="font-display font-bold text-white">Change admin password</div>
            <div className="text-sm text-gray-500">Update the password used to access this admin panel.</div>
          </div>
        </div>
        <div className="space-y-4 max-w-md">
          <div><label className="label mb-1.5 block">Current password</label><input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="input-field" placeholder="Enter current password" /></div>
          <div><label className="label mb-1.5 block">New password</label><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input-field" placeholder="Enter new password" /></div>
          <div><label className="label mb-1.5 block">Confirm new password</label><input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="input-field" placeholder="Re-enter new password" /></div>
          {pwMsg && <div className={`p-3 rounded-xl text-sm ${pwMsg.type === 'ok' ? 'bg-emerald2-500/10 border border-emerald2-500/20 text-emerald2-400' : 'bg-rose2-500/10 border border-rose2-500/20 text-rose2-400'}`}>{pwMsg.text}</div>}
          <button onClick={handlePasswordChange} disabled={pwLoading} className="btn-primary disabled:opacity-50"><Lock className="w-4 h-4" /> {pwLoading ? 'Changing…' : 'Change password'}</button>
        </div>
      </div>
    </div>
  );
}
