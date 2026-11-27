import { ArrowRight, Shield, Zap, TrendingUp, Lock, Sparkles } from 'lucide-react';

type HeroProps = {
  onApply: () => void;
  onSignIn: () => void;
};

export default function Hero({ onApply, onSignIn }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/50 to-ink-950" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-emerald2-500/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left: copy */}
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gold-400/20 mb-6">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-sm text-gold-200 font-medium">Now accepting new members</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
            <span className="text-gradient-white">Banking,</span>
            <br />
            <span className="text-gradient-gold">redefined</span>
            <span className="text-gradient-white">.</span>
          </h1>

          <p className="text-lg text-gray-400 leading-relaxed max-w-md mb-8">
            A private digital bank engineered for the modern world. Accounts, cards,
            crypto, and credit — unified in one beautifully crafted experience.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <button onClick={onApply} className="btn-primary">
              Open an account
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onSignIn} className="btn-ghost">
              Sign in
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Shield, label: '256-bit encrypted' },
              { icon: Lock, label: 'FDIC insured' },
              { icon: Zap, label: 'Instant transfers' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm text-gray-500">
                <b.icon className="w-4 h-4 text-gold-400/70" />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D card */}
        <div className="relative perspective-1000 hidden lg:block">
          <div className="relative animate-float preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
            {/* Main card */}
            <div
              className="relative w-[420px] h-[260px] rounded-2xl p-7 shadow-3d-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1018 50%, #1c2230 100%)',
                transform: 'rotateY(-12deg) rotateX(8deg)',
              }}
            >
              {/* sheen */}
              <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-gold-400/10 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 via-transparent to-emerald2-500/5" />

              <div className="relative flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.3em] text-gold-400/70 uppercase mb-1">AGB</div>
                    <div className="text-sm text-gray-400">Private Card</div>
                  </div>
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-gold-300/80 to-gold-600/60 shadow-glow-gold" />
                </div>

                <div className="font-mono text-xl text-white/90 tracking-wider">
                  •••• •••• •••• 8421
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Cardholder</div>
                    <div className="text-sm text-white font-medium">A. HARTLEY</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-7 h-7 rounded-full bg-rose2-500/80" />
                    <div className="w-7 h-7 rounded-full bg-gold-400/80 -ml-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating mini stats */}
            <div
              className="absolute -top-10 -right-8 glass-card p-4 w-44 animate-float-slow"
              style={{ transform: 'rotateY(-12deg) rotateX(8deg) translateZ(40px)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald2-400" />
                <span className="text-xs text-gray-400">Total Balance</span>
              </div>
              <div className="font-display font-bold text-xl text-white">$248,592</div>
              <div className="text-xs text-emerald2-400 mt-1">+4.2% this month</div>
            </div>

            <div
              className="absolute -bottom-8 -left-10 glass-card p-4 w-40 animate-float-slow"
              style={{ transform: 'rotateY(-12deg) rotateX(8deg) translateZ(30px)', animationDelay: '2s' }}
            >
              <div className="text-xs text-gray-400 mb-1">BTC Holding</div>
              <div className="font-display font-bold text-lg text-white">0.8421 BTC</div>
              <div className="text-xs text-gold-400 mt-1">$54,210.00</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gold-400/50 to-transparent" />
      </div>
    </section>
  );
}
