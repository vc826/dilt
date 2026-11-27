import { Bitcoin, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

export default function CryptoShowcase() {
  const coins = [
    { symbol: 'BTC', name: 'Bitcoin', price: 64210.5, change: 2.4 },
    { symbol: 'ETH', name: 'Ethereum', price: 3512.8, change: 3.1 },
    { symbol: 'SOL', name: 'Solana', price: 168.2, change: -1.2 },
    { symbol: 'USDC', name: 'USD Coin', price: 1.0, change: 0.01 },
    { symbol: 'XRP', name: 'Ripple', price: 0.62, change: 4.8 },
    { symbol: 'ADA', name: 'Cardano', price: 0.48, change: -0.5 },
  ];

  return (
    <section id="crypto" className="relative py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-400 text-sm font-medium tracking-[0.2em] uppercase">Crypto</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4">
            <span className="text-gradient-white">Trade digital </span>
            <span className="text-gradient-gold">assets</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Buy, sell, and swap cryptocurrencies instantly — right from your Alliance Global Bank
            account. No separate exchange, no extra fees.
          </p>
        </div>

        {/* Live ticker */}
        <div className="glass-card overflow-hidden mb-10">
          <div className="flex items-center animate-ticker whitespace-nowrap py-4">
            {[...coins, ...coins].map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-8 border-r border-white/5">
                <Bitcoin className="w-5 h-5 text-gold-400" />
                <span className="font-display font-semibold text-white">{c.symbol}</span>
                <span className="font-mono text-sm text-gray-400">
                  ${c.price.toLocaleString()}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    c.change >= 0 ? 'text-emerald2-400' : 'text-rose2-400'
                  }`}
                >
                  {c.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(c.change)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coin grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {coins.map((c) => (
            <div key={c.symbol} className="glass-card p-5 hover:border-gold-400/20 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400/20 to-ink-700 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-gold-400" />
                </div>
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
              </div>
              <div className="font-display font-bold text-white">{c.symbol}</div>
              <div className="text-xs text-gray-500 mb-2">{c.name}</div>
              <div className="font-mono text-sm text-white">${c.price.toLocaleString()}</div>
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${
                  c.change >= 0 ? 'text-emerald2-400' : 'text-rose2-400'
                }`}
              >
                {c.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {c.change >= 0 ? '+' : ''}{c.change}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
