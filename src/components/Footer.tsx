import { Landmark, Twitter, Linkedin, Github, Mail } from 'lucide-react';

export default function Footer() {
  const cols = [
    {
      title: 'Product',
      links: ['Accounts', 'Cards', 'Crypto', 'Loans', 'Wealth'],
    },
    {
      title: 'Company',
      links: ['About', 'Careers', 'Press', 'Blog', 'Contact'],
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Security', 'FDIC', 'Licenses'],
    },
  ];

  return (
    <footer className="relative border-t border-white/5 pt-20 pb-10 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow-gold">
                <Landmark className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-display font-extrabold text-lg text-white">Alliance Global</span>
                <span className="block text-[10px] text-gold-400/80 tracking-[0.2em] uppercase -mt-1">Bank</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              A global digital bank engineered for the modern world. Built on
              trust, designed for elegance.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xs text-gray-500">+1 (934) 203-2652</p>
              <p className="text-xs text-gray-500">contact@allianceglobalbank.com</p>
              <p className="text-xs text-gray-500">New Orleans, LA · Frankfurt, Germany · London, UK</p>
            </div>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-gold-400 hover:border-gold-400/20 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gold-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2026 Alliance Global Bank. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with precision. Secured by design.
          </p>
        </div>
      </div>
    </footer>
  );
}
