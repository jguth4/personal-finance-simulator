import { useState, useEffect } from 'react';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';
import { BENCHMARKS } from '../data/benchmarks';
import { opportunityCost, futureValue } from '../utils/finance';

const EDIT_DELAY_MS = 30000;

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtK(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

// ── Opportunity cost callout ──────────────────────────────────────────────

function OppCostCallout({ item }) {
  const benchmark = item.benchmarkId ? BENCHMARKS[item.benchmarkId] : null;
  if (!benchmark) return null;

  const excess = item.amount - benchmark.monthlyBenchmark;
  if (excess <= 0) return null;

  const oc = opportunityCost(excess);
  if (oc < 500) return null;

  return (
    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
      <p className="text-xs text-amber-800">
        <span className="font-semibold">{fmt(excess)}/mo above typical</span>
        {' '}(avg: {fmt(benchmark.monthlyBenchmark)})
      </p>
      <p className="text-xs text-amber-700">
        Invested 30 years at 7%: <span className="font-bold text-amber-900">{fmtK(oc)} foregone</span>
        {' '}·{' '}
        <a
          href={benchmark.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-amber-600 hover:text-amber-800"
        >
          source
        </a>
      </p>
    </div>
  );
}

// ── Line item row ─────────────────────────────────────────────────────────

function LineItem({ item, takeHome }) {
  const pct = Math.round((item.amount / takeHome) * 100);
  const benchmark = item.benchmarkId ? BENCHMARKS[item.benchmarkId] : null;
  const isHigh = benchmark && item.amount > benchmark.monthlyBenchmark;

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <p className="text-sm font-medium text-slate-800">{item.name}</p>
          {benchmark && (
            <p className="text-xs text-slate-400 mt-0.5">
              Typical: {fmt(benchmark.monthlyBenchmark)}/mo
              {isHigh && <span className="text-amber-500 ml-1">↑ above avg</span>}
              {!isHigh && <span className="text-emerald-500 ml-1">✓ at or below avg</span>}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{fmt(item.amount)}</p>
          <p className="text-xs text-slate-400">{pct}%</p>
        </div>
      </div>
      <OppCostCallout item={item} />
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────

function GroupSection({ group, items, takeHome }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{group}</p>
        <p className="text-xs font-semibold text-slate-700">{fmt(total)}/mo</p>
      </div>
      <div className="px-4">
        {items.map((item) => (
          <LineItem key={item.id} item={item} takeHome={takeHome} />
        ))}
      </div>
    </div>
  );
}

// ── Emergency fund warning ────────────────────────────────────────────────

function EmergencyWarning({ surplus, monthlyExpenses }) {
  const emergencyMonths = surplus > 0 ? (surplus * 3 / monthlyExpenses).toFixed(1) : 0;
  if (surplus >= 200) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
      <p className="text-sm font-bold text-red-900">⚠️ No emergency cushion</p>
      <p className="text-xs text-red-700">
        {surplus <= 0
          ? 'You\'re spending more than you earn. Any unexpected expense goes on a credit card.'
          : `You have ${fmt(surplus)}/mo left over — less than a 1-month buffer. The average unexpected expense in NYC is $600.`}
      </p>
      <p className="text-xs text-red-600">
        Source: Federal Reserve Report on the Economic Well-Being of U.S. Households (2023) —
        40% of Americans can't cover a $400 unexpected expense.
      </p>
    </div>
  );
}

// ── Countdown badge ───────────────────────────────────────────────────────

function CountdownBadge({ secondsLeft }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">
        Sit with this for a moment... adjust in{' '}
        <span className="font-semibold text-slate-600">{secondsLeft}s</span>
      </p>
    </div>
  );
}

// ── Unified OC + investing bridge banner ──────────────────────────────────

function UnifiedOCBanner({ totalOC, surplus }) {
  const surplusInvested = surplus > 0 ? futureValue(surplus, 0.07, 40) : 0;
  const deliveryOC = futureValue(20, 0.07, 30); // 1 fewer delivery/wk ≈ $20/mo saved

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">The bigger picture</p>

      {totalOC > 0 && (
        <div>
          <p className="text-sm text-slate-300">Your above-average spending, invested for 30 years:</p>
          <p className="text-2xl font-bold text-amber-400">{fmtK(totalOC)} foregone</p>
          <p className="text-xs text-slate-400 mt-0.5">That's what your lifestyle costs in retirement wealth — not a verdict, a trade-off.</p>
        </div>
      )}

      {surplus > 0 ? (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-sm text-slate-300">Your {fmtK(surplus)}/mo surplus, invested from age 22:</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtK(surplusInvested)} by age 62</p>
          <p className="text-xs text-slate-400 mt-0.5">At 7%/yr in an index fund. Next year we run the math on where this goes.</p>
        </div>
      ) : (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-sm text-slate-300">Right now you have nothing left to invest.</p>
          <p className="text-xs text-slate-400 mt-0.5">One adjustment could change that. Try the sandbox.</p>
        </div>
      )}

      <div className="border-t border-slate-700 pt-3">
        <p className="text-xs text-slate-400">
          One fewer delivery order per week (~$20/mo saved) invested for 30 years:{' '}
          <span className="text-white font-semibold">{fmtK(deliveryOC)}</span>
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function BudgetReveal({ budget, onAdjust, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(EDIT_DELAY_MS / 1000));
  const [editAllowed, setEditAllowed] = useState(false);

  // 3-second delay before showing breakdown, then 30s before "Adjust" button
  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), 3000);
    return () => clearTimeout(revealTimer);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const done = setTimeout(() => setEditAllowed(true), EDIT_DELAY_MS);
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { clearTimeout(done); clearInterval(tick); };
  }, [revealed]);

  const totalSpent = budget.reduce((s, i) => s + i.amount, 0);
  const surplus = TAKE_HOME_MONTHLY - totalSpent;
  const isOver = surplus < 0;

  // Group items
  const groups = budget.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const groupOrder = ['Housing', 'Food', 'Getting Around', 'Subscriptions & Shopping', 'Personal & Lifestyle', 'Essential'];

  // Total opportunity cost
  const totalOC = budget.reduce((sum, item) => {
    if (!item.benchmarkId) return sum;
    const b = BENCHMARKS[item.benchmarkId];
    if (!b) return sum;
    const excess = item.amount - b.monthlyBenchmark;
    return sum + (excess > 0 ? opportunityCost(excess) : 0);
  }, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* ── Beat 1: The number ── */}
      <div className={`rounded-2xl p-6 text-center border-2 ${isOver ? 'bg-red-50 border-red-300' : surplus < 300 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
        <p className="text-sm font-medium text-slate-600 mb-1">Based on your answers, you'd spend</p>
        <p className="text-5xl font-bold text-slate-900">{fmt(totalSpent)}</p>
        <p className="text-slate-500 text-sm mt-1">per month</p>
        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-around">
          <div>
            <p className="text-xs text-slate-500">Take-home</p>
            <p className="font-bold text-slate-800">{fmt(TAKE_HOME_MONTHLY)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{isOver ? 'Shortfall' : 'Left over'}</p>
            <p className={`font-bold ${isOver ? 'text-red-600' : surplus < 300 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isOver ? '−' : '+'}{fmt(Math.abs(surplus))}
            </p>
          </div>
        </div>
      </div>

      {!revealed && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-2">Breaking down your numbers...</p>
        </div>
      )}

      {/* ── Beat 2: Breakdown ── */}
      {revealed && (
        <>
          {/* Groups */}
          {groupOrder.map((group) =>
            groups[group] ? (
              <GroupSection
                key={group}
                group={group}
                items={groups[group]}
                takeHome={TAKE_HOME_MONTHLY}
              />
            ) : null
          )}

          <EmergencyWarning surplus={surplus} monthlyExpenses={totalSpent} />

          {/* Fix L: Unified opportunity cost + investing bridge banner */}
          <UnifiedOCBanner totalOC={totalOC} surplus={surplus} />

          {/* Controls */}
          <div className="space-y-3 pt-2">
            {!editAllowed && <CountdownBadge secondsLeft={secondsLeft} />}

            {editAllowed && (
              <button
                onClick={onAdjust}
                className="w-full border-2 border-indigo-600 text-indigo-700 font-semibold py-3 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
              >
                Adjust my choices →
              </button>
            )}

            <button
              onClick={onContinue}
              disabled={!editAllowed}
              className={`w-full font-semibold py-3 rounded-xl text-sm transition-colors ${
                editAllowed
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Keep this budget →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
