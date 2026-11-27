import { useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

export default function LoanCalculator() {
  const [amount, setAmount] = useState(25000);
  const [term, setTerm] = useState(36);
  const rate = 6.99;

  const monthlyRate = rate / 100 / 12;
  const monthlyPayment =
    (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  const totalPaid = monthlyPayment * term;
  const totalInterest = totalPaid - amount;

  return (
    <section id="loans" className="relative py-24 px-5">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-400 text-sm font-medium tracking-[0.2em] uppercase">Loans</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 mb-4">
            <span className="text-gradient-white">Credit on </span>
            <span className="text-gradient-gold">your terms</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Pre-approved personal loans with transparent rates and no hidden fees.
            Calculate your payment below.
          </p>
        </div>

        <div className="glass-card p-8 md:p-10 grid md:grid-cols-2 gap-10 items-center">
          {/* Controls */}
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="label">Loan amount</label>
                <span className="font-display font-bold text-xl text-white">
                  ${amount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-ink-700 appearance-none cursor-pointer accent-gold-400"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>$5,000</span>
                <span>$100,000</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="label">Term</label>
                <span className="font-display font-bold text-xl text-white">
                  {term} months
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="12"
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-ink-700 appearance-none cursor-pointer accent-gold-400"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>12 mo</span>
                <span>72 mo</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-900/60 border border-white/5">
              <Calculator className="w-5 h-5 text-gold-400" />
              <div>
                <div className="text-xs text-gray-500">Interest rate</div>
                <div className="font-display font-bold text-white">{rate}% APR</div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-transparent rounded-2xl blur-2xl" />
            <div className="relative glass-card p-8 text-center">
              <TrendingUp className="w-8 h-8 text-gold-400 mx-auto mb-4" />
              <div className="label mb-2">Monthly payment</div>
              <div className="font-display font-extrabold text-5xl text-gradient-gold mb-6">
                ${monthlyPayment.toFixed(2)}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div>
                  <div className="label mb-1">Total interest</div>
                  <div className="font-display font-bold text-lg text-white">
                    ${totalInterest.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="label mb-1">Total repayment</div>
                  <div className="font-display font-bold text-lg text-white">
                    ${totalPaid.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
