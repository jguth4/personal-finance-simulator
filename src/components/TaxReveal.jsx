import { useState } from 'react';
import {
  GROSS_ANNUAL, GROSS_MONTHLY, TAX_BREAKDOWN, TAKE_HOME_MONTHLY,
  MARGINAL_FEDERAL, EFFECTIVE_FEDERAL, EFFECTIVE_COMBINED,
  computeTaxBreakdown,
} from '../data/taxConstants';
import Tooltip from './Tooltip';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(n) {
  return (n * 100).toFixed(1) + '%';
}

export default function TaxReveal({ onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const [showMarginal, setShowMarginal] = useState(false);

  // Show what a $5k raise actually costs in federal tax
  const raiseAmount = 5000;
  const withRaise   = computeTaxBreakdown(GROSS_ANNUAL + raiseAmount);
  const currentFed  = TAX_BREAKDOWN.find((t) => t.label === 'Federal income tax')?.annual ?? 0;
  const extraTax    = withRaise.breakdown.find((t) => t.label === 'Federal income tax')?.annual - currentFed;

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-2xl mx-auto">
      <div className="text-center">
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Your salary</p>
        <p className="text-5xl font-bold text-slate-900">${GROSS_ANNUAL.toLocaleString()}</p>
        <p className="text-slate-500 text-sm mt-1">per year · NYC · college grad median</p>
      </div>

      <div className="text-center">
        <p className="text-slate-600 text-base">Monthly gross paycheck</p>
        <p className="text-3xl font-semibold text-slate-800">{fmt(GROSS_MONTHLY)}</p>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl text-base transition-colors"
        >
          See what you actually take home →
        </button>
      ) : (
        <div className="w-full space-y-3">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
              <span>Gross monthly</span>
              <span>{fmt(GROSS_MONTHLY)}</span>
            </div>
            {TAX_BREAKDOWN.map((t) => (
              <div key={t.label} className="flex justify-between text-sm text-slate-600">
                <span className="flex items-center">
                  {t.label}
                  <Tooltip text={t.description} />
                </span>
                <span className="text-red-500 font-medium">− {fmt(Math.round(t.annual / 12))}</span>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-indigo-900 font-bold text-lg">Take-home pay</p>
              <p className="text-indigo-600 text-xs">What actually hits your bank account</p>
            </div>
            <p className="text-indigo-700 font-bold text-2xl">{fmt(TAKE_HOME_MONTHLY)}<span className="text-sm font-normal">/mo</span></p>
          </div>

          <p className="text-center text-slate-500 text-xs px-2">
            That's {Math.round((TAKE_HOME_MONTHLY / GROSS_MONTHLY) * 100)}% of your gross pay.
            Now build a budget with what's left.
          </p>

          {/* Marginal vs. effective rate explainer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <button
              onClick={() => setShowMarginal((v) => !v)}
              className="w-full flex justify-between items-center text-left"
            >
              <div>
                <p className="text-amber-900 font-semibold text-sm">
                  Myth: "A raise could put me in a higher bracket and cost me money."
                </p>
                <p className="text-amber-700 text-xs mt-0.5">Tap to see why this is impossible.</p>
              </div>
              <span className="text-amber-600 text-lg ml-2">{showMarginal ? '▲' : '▼'}</span>
            </button>

            {showMarginal && (
              <div className="space-y-3 pt-1 border-t border-amber-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xs text-slate-500 mb-1">Marginal federal rate</p>
                    <p className="text-2xl font-bold text-amber-700">{pct(MARGINAL_FEDERAL)}</p>
                    <p className="text-xs text-slate-400 mt-1">Applied to your last dollar earned</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xs text-slate-500 mb-1">Effective federal rate</p>
                    <p className="text-2xl font-bold text-emerald-700">{pct(EFFECTIVE_FEDERAL)}</p>
                    <p className="text-xs text-slate-400 mt-1">Total federal tax ÷ gross income</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>How brackets actually work:</strong> Only the dollars <em>above</em> each threshold get taxed at that rate — not your whole income.
                  Your first $12,000 of taxable income is taxed at 10%, the next chunk at 12%, and so on.
                  The 22% rate only applies to the portion of income between $64,400 and $72,500.
                </p>

                <div className="bg-white rounded-lg p-3 border border-amber-100">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    If you got a {fmt(raiseAmount)} raise to {fmt(GROSS_ANNUAL + raiseAmount)}:
                  </p>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Extra federal tax owed</span>
                    <span className="font-semibold text-red-500">+{fmt(extraTax)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>Extra take-home after tax</span>
                    <span className="font-semibold text-emerald-600">+{fmt(raiseAmount - extraTax - Math.round((raiseAmount) * 0.0765))}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    A raise always increases your take-home pay. Always.
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  Your combined effective tax rate (all taxes): <strong>{pct(EFFECTIVE_COMBINED)}</strong>.
                  Your federal marginal rate: <strong>{pct(MARGINAL_FEDERAL)}</strong> — only on dollars above $64,400.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl text-base transition-colors"
          >
            Build my budget →
          </button>
        </div>
      )}
    </div>
  );
}
