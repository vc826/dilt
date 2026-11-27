import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Account, Card } from '@/lib/supabase';
import { formatCurrency, maskAccount, generateCardLast4 } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';
import { CreditCard, Snowflake, Plus, Check, X } from 'lucide-react';

type Props = {
  cards: Card[];
  accounts: Account[];
  onRefresh: () => void;
};

function BankCard3D({ card, account }: { card: Card; account?: Account }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glowX: 50, glowY: 50 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const maxTilt = 12;
    setTilt({
      rx: (0.5 - py) * maxTilt,
      ry: (px - 0.5) * maxTilt,
      glowX: px * 100,
      glowY: py * 100,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, glowX: 50, glowY: 50 });
  };

  const isCredit = card.type === 'credit';
  const isVirtual = card.type === 'virtual';

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative aspect-[1.6/1] rounded-2xl p-6 overflow-hidden transition-transform duration-200 ease-out cursor-pointer select-none"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.02)`,
        transformStyle: 'preserve-3d',
        background: isCredit
          ? 'linear-gradient(135deg, #9a5b08, #663b0e, #0d1018)'
          : isVirtual
          ? 'linear-gradient(135deg, #059669, #0d3b2e, #0a0c14)'
          : 'linear-gradient(135deg, #1e2433, #0a0c14, #000000)',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 30px rgba(212,168,67,0.08)',
      }}
    >
      {/* Gloss overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(255,255,255,0.12) 0%, transparent 45%)`,
        }}
      />
      {/* Ambient blobs */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/[0.04] blur-2xl" />
      <div className="absolute -bottom-16 -left-8 w-36 h-36 rounded-full bg-gold-400/[0.05] blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/30" />

      {/* Holographic strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: isCredit
            ? 'linear-gradient(90deg, transparent, rgba(212,168,67,0.6), transparent)'
            : isVirtual
            ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col h-full justify-between text-white" style={{ transform: 'translateZ(40px)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase">{card.type}</div>
            <div className="font-display font-bold text-lg tracking-tight">Alliance Global Bank</div>
          </div>
          {/* Chip */}
          <div className="relative w-11 h-8 rounded-md overflow-hidden" style={{ background: 'linear-gradient(135deg, #d4a843, #8a6a1a, #c9a227)' }}>
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-black/20 rounded-[1px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Contactless icon */}
        <div className="absolute top-14 right-6 text-white/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3a8 8 0 0 1 0 18M12 6a5 5 0 0 1 0 12M15 9a2 2 0 0 1 0 6" />
          </svg>
        </div>

        <div className="font-mono text-sm text-white/70 tracking-[0.15em]" style={{ transform: 'translateZ(25px)' }}>
          ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{card.card_number_last4}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Cardholder</div>
            <div className="text-sm font-medium tracking-wide">{card.card_holder}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Expires</div>
            <div className="text-xs text-white/70 font-mono">
              {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
            </div>
          </div>
        </div>
      </div>

      {/* Mastercard-style interlocking circles */}
      <div className="absolute bottom-5 right-5 flex items-center" style={{ transform: 'translateZ(20px)' }}>
        <div className="w-6 h-6 rounded-full bg-rose2-500/40" />
        <div className="w-6 h-6 rounded-full bg-gold-400/40 -ml-3 mix-blend-screen" />
      </div>
    </div>
  );
}

export default function CardsTab({ cards, accounts, onRefresh }: Props) {
  const { customer } = useAuth();
  const [showOrder, setShowOrder] = useState(false);
  const [cardType, setCardType] = useState<'debit' | 'credit' | 'virtual'>('debit');
  const [linkAccount, setLinkAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFreeze = async (cardId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    await supabase.from('cards').update({ status: newStatus }).eq('id', cardId);
    onRefresh();
  };

  const handleOrder = async () => {
    setError(null);
    if (!customer || !linkAccount) { setError('Select an account to link.'); return; }
    setLoading(true);
    const now = new Date();
    const { error: insErr } = await supabase.from('cards').insert({
      customer_id: customer.id,
      account_id: linkAccount,
      card_number_last4: generateCardLast4(),
      card_holder: customer.full_name.toUpperCase(),
      expiry_month: now.getMonth() + 1,
      expiry_year: now.getFullYear() + 4,
      type: cardType,
      status: 'pending',
    });
    if (insErr) { setError('Could not order card. Try again.'); setLoading(false); return; }
    setLoading(false);
    setShowOrder(false);
    setLinkAccount('');
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-white">Cards</h1>
          <p className="text-gray-500 text-sm">Manage and order payment cards.</p>
        </div>
        <button onClick={() => setShowOrder(true)} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Order card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No cards yet. Order one to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const acct = accounts.find((a) => a.id === card.account_id);
            return (
              <div key={card.id} className="space-y-4">
                <BankCard3D card={card} account={acct} />
                <div className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium capitalize">{card.type} card</div>
                    <div className="text-xs text-gray-500">Linked: {acct ? maskAccount(acct.account_number) : '—'}</div>
                    {card.status === 'pending' && <div className="text-xs text-gold-300 mt-1">Awaiting admin approval</div>}
                  </div>
                  {card.status === 'pending' ? (
                    <span className="chip bg-gold-400/15 text-gold-300">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleToggleFreeze(card.id, card.status)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        card.status === 'active' ? 'bg-rose2-500/10 text-rose2-400 hover:bg-rose2-500/20' : 'bg-emerald2-500/10 text-emerald2-400 hover:bg-emerald2-500/20'
                      }`}
                    >
                      <Snowflake className="w-4 h-4" />
                      {card.status === 'active' ? 'Freeze' : 'Unfreeze'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowOrder(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <div className="relative glass-card p-6 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-white mb-1">Order a new card</h3>
            <p className="text-sm text-gray-500 mb-5">Choose your card type and link an account.</p>
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Card type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['debit', 'credit', 'virtual'] as const).map((t) => (
                    <button key={t} onClick={() => setCardType(t)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                        cardType === t ? 'bg-gold-400/20 border border-gold-400/40 text-gold-200' : 'bg-ink-900/60 border border-white/10 text-gray-400'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Link to account</label>
                <select value={linkAccount} onChange={(e) => setLinkAccount(e.target.value)} className="input-field">
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.type} — {maskAccount(a.account_number)}</option>
                  ))}
                </select>
              </div>
              {error && <div className="p-3 rounded-xl bg-rose2-500/10 border border-rose2-500/20 text-sm text-rose2-400">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setShowOrder(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleOrder} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                  {loading ? 'Ordering…' : 'Order card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
