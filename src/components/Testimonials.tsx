import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Adrienne Hartley',
      role: 'Founder, Lumen Studio',
      quote: 'Alliance Global Bank replaced three different apps for me. The card design alone made me switch, but the crypto integration is what kept me.',
    },
    {
      name: 'Marcus Chen',
      role: 'Software Engineer',
      quote: 'I got approved for a loan in under five minutes. The rate was better than my credit union. This is the future of banking.',
    },
    {
      name: 'Sofia Almeida',
      role: 'Creative Director',
      quote: 'Every detail feels intentional — from the dark interface to the instant notifications. It actually makes managing money enjoyable.',
    },
  ];

  return (
    <section className="relative py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-400 text-sm font-medium tracking-[0.2em] uppercase">Testimonials</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4">
            <span className="text-gradient-white">Loved by </span>
            <span className="text-gradient-gold">members</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card p-8 hover:border-gold-400/20 transition-all duration-500">
              <Quote className="w-8 h-8 text-gold-400/30 mb-4" />
              <p className="text-gray-300 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-display font-bold text-ink-950">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-display font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="glass-card mt-12 p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '$2.4B', label: 'Assets under management' },
            { num: '180K+', label: 'Active members' },
            { num: '4.9★', label: 'App Store rating' },
            { num: '0', label: 'Hidden fees' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display font-extrabold text-3xl text-gradient-gold mb-1">{s.num}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
