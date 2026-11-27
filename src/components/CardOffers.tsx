import { Wifi, Snowflake } from 'lucide-react';

export default function CardOffers() {
  const cards = [
    {
      name: 'AGB Black',
      tier: 'Private',
      color: 'from-gray-800 via-ink-900 to-black',
      perk: 'Unlimited airport lounges',
      rate: '0% FX fees',
      fee: '$0/mo',
      glow: 'shadow-glow-gold',
    },
    {
      name: 'AGB Gold',
      tier: 'Premium',
      color: 'from-gold-600 via-gold-800 to-ink-900',
      perk: '5x rewards on dining',
      rate: '2% cashback',
      fee: '$15/mo',
      glow: 'shadow-glow-gold',
    },
    {
      name: 'AGB Virtual',
      tier: 'Digital',
      color: 'from-emerald2-600 via-ink-800 to-ink-900',
      perk: 'Instant virtual issuance',
      rate: '1.5% cashback',
      fee: 'Free',
      glow: 'shadow-glow-emerald',
    },
  ];

  return (
    <section id="cards" className="relative py-24 px-5">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-400 text-sm font-medium tracking-[0.2em] uppercase">Cards</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4">
            <span className="text-gradient-white">Choose your </span>
            <span className="text-gradient-gold">status</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three tiers. One uncompromising standard. Every card is crafted from
            premium materials and works everywhere.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div
              key={card.name}
              className="group perspective-1000"
              style={{ perspective: '1000px' }}
            >
              <div
                className={`relative w-full aspect-[1.6/1] rounded-2xl p-6 shadow-3d-lg ${card.glow} overflow-hidden transition-all duration-700 group-hover:scale-105 group-hover:rotate-1`}
                style={{
                  background: `linear-gradient(135deg, ${i === 0 ? '#1a1f2e, #05060a, #000' : i === 1 ? '#9a5b08, #663b0e, #0d1018' : '#059669, #11151f, #0a0c14'})`,
                }}
              >
                {/* Sheen */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />

                <div className="relative flex flex-col h-full justify-between text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] tracking-[0.3em] text-white/60 uppercase">{card.tier}</div>
                      <div className="font-display font-bold text-lg mt-0.5">{card.name}</div>
                    </div>
                    <Wifi className="w-6 h-6 text-white/40 rotate-90" />
                  </div>

                  <div className="w-10 h-7 rounded bg-gradient-to-br from-gold-300/60 to-gold-600/40" />

                  <div className="font-mono text-sm text-white/80 tracking-widest">
                    •••• •••• •••• {1000 + i * 333}
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-xs text-white/70">{card.fee}</div>
                    <Snowflake className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <div className="font-display font-bold text-white text-lg">{card.name}</div>
                <div className="text-sm text-gold-400 mt-1">{card.perk}</div>
                <div className="text-sm text-gray-500 mt-0.5">{card.rate} · {card.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
