import { CreditCard, Bitcoin, Coins, Landmark, Wallet, ShieldCheck } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Wallet,
      title: 'Smart Accounts',
      desc: 'Checking, savings, and investment accounts with instant transfers and real-time updates.',
      gradient: 'from-gold-400/20 to-gold-600/5',
    },
    {
      icon: CreditCard,
      title: 'Premium Cards',
      desc: 'Metal and virtual cards with zero foreign transaction fees and instant freeze controls.',
      gradient: 'from-emerald2-400/20 to-emerald2-600/5',
    },
    {
      icon: Bitcoin,
      title: 'Crypto Trading',
      desc: 'Buy, sell, and swap 50+ cryptocurrencies directly from your account balance.',
      gradient: 'from-gold-300/20 to-gold-500/5',
    },
    {
      icon: Coins,
      title: 'Loans & Credit',
      desc: 'Pre-approved personal loans with competitive rates and flexible repayment terms.',
      gradient: 'from-emerald2-500/20 to-emerald2-600/5',
    },
    {
      icon: ShieldCheck,
      title: 'Bank-Grade Security',
      desc: 'Biometric authentication, 256-bit encryption, and real-time fraud monitoring.',
      gradient: 'from-gold-400/20 to-gold-600/5',
    },
    {
      icon: Landmark,
      title: 'Wealth Management',
      desc: 'Automated portfolios and expert advisory services tailored to your goals.',
      gradient: 'from-emerald2-400/20 to-emerald2-600/5',
    },
  ];

  return (
    <section id="accounts" className="relative py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-400 text-sm font-medium tracking-[0.2em] uppercase">Everything you need</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4">
            <span className="text-gradient-white">One app. </span>
            <span className="text-gradient-gold">All your money.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From everyday spending to long-term investing, Alliance Global Bank brings every financial
            tool into a single, elegant interface.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-7 group hover:border-gold-400/20 transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                <f.icon className="w-7 h-7 text-gold-300" strokeWidth={1.8} />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
