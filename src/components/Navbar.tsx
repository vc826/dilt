import { useState, useEffect } from 'react';
import { Landmark, Menu, X, User } from 'lucide-react';

type NavbarProps = {
  onSignIn: () => void;
  onApply: () => void;
};

export default function Navbar({ onSignIn, onApply }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Accounts', href: '#accounts' },
    { label: 'Cards', href: '#cards' },
    { label: 'Crypto', href: '#crypto' },
    { label: 'Loans', href: '#loans' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-3d py-3' : 'py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow-gold group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">Alliance Global</span>
            <span className="block text-[10px] text-gold-400/80 tracking-[0.2em] uppercase -mt-1">Bank</span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={onSignIn} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors px-3 py-2">
            <User className="w-4 h-4" />
            Sign In
          </button>
          <button onClick={onApply} className="btn-primary text-sm py-2.5">
            Open Account
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden glass border-t border-white/5 mt-3 animate-fade-in">
          <div className="px-5 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="h-px bg-white/5" />
            <button onClick={() => { onSignIn(); setMenuOpen(false); }} className="flex items-center gap-2 text-gray-300 text-left">
              <User className="w-4 h-4" /> Sign In
            </button>
            <button onClick={() => { onApply(); setMenuOpen(false); }} className="btn-primary text-sm">
              Open Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
