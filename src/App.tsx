import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CardOffers from '@/components/CardOffers';
import CryptoShowcase from '@/components/CryptoShowcase';
import LoanCalculator from '@/components/LoanCalculator';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import ApplicationModal from '@/components/ApplicationModal';
import CustomerDashboard from '@/components/CustomerDashboard';
import AdminPanel from '@/components/AdminPanel';

export default function App() {
  const { customer, loading } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [showApply, setShowApply] = useState(false);

  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#admin'))) {
    return <AdminPanel />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="w-12 h-12 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
      </div>
    );
  }

  if (customer) {
    return <CustomerDashboard />;
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar
        onSignIn={() => setAuthModal(true)}
        onApply={() => setShowApply(true)}
      />
      <main>
        <Hero
          onApply={() => setShowApply(true)}
          onSignIn={() => setAuthModal(true)}
        />
        <Features />
        <CardOffers />
        <CryptoShowcase />
        <LoanCalculator />
        <Testimonials />
      </main>
      <Footer />

      {authModal && (
        <AuthModal
          onClose={() => setAuthModal(false)}
          onApply={() => { setAuthModal(false); setShowApply(true); }}
        />
      )}

      {showApply && (
        <ApplicationModal
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false);
            setAuthModal(true);
          }}
        />
      )}
    </div>
  );
}
