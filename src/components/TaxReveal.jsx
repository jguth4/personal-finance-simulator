import { useState } from 'react';
import { GROSS_ANNUAL, GROSS_MONTHLY, TAX_BREAKDOWN, TAKE_HOME_MONTHLY } from '../data/taxConstants';
import Tooltip from './Tooltip';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function TaxReveal({ onContinue }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-md mx-auto">
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
        <div className="w-full space-y-2">
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

          <button
            onClick={onContinue}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl text-base transition-colors mt-2"
          >
            Build my budget →
          </button>
        </div>
      )}
    </div>
  );
}
