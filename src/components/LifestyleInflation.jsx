import { useState, useMemo } from 'react';
import { futureValue } from '../utils/finance';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

const RAISE_MONTHLY = 780; // $72,500 → $85,000 = $12,500 gross; after ~40% marginal = ~$780/mo net
const AVERAGE_SAVED_RATE = 0.27; // Federal Reserve: avg American saves ~27% of a raise

const QUESTIONS = [
  {
    id: 'apartment',
    q: 'A nicer apartment opened up closer to your new job — $400/mo more. Do you take it?',
    sub: 'Your commute would drop from 35 min to 12 min.',
    options: [
      { label: 'Yes — I deserve the upgrade', extraSpend: 400 },
      { label: 'Maybe — I\'d find something in between', extraSpend: 200 },
      { label: 'No — I\'ll keep my current place', extraSpend: 0 },
    ],
  },
  {
    id: 'lunch',
    q: 'Your new coworkers go to nicer lunch spots. You\'re with them daily.',
    sub: '$22 instead of $12 per lunch — you\'d spend ~$43/mo more.',
    options: [
      { label: 'I go with them — worth it for the social time', extraSpend: 43 },
      { label: 'Sometimes — a couple times a week', extraSpend: 22 },
      { label: 'I bring my lunch or find cheaper options', extraSpend: 0 },
    ],
  },
  {
    id: 'phone',
    q: 'You\'ve had the same phone for 3 years. The new iPhone just dropped ($1,200).',
    sub: 'Amortized over 2 years: ~$50/mo.',
    options: [
      { label: 'I get it — I use my phone constantly', extraSpend: 100 },
      { label: 'I\'ll wait 6 months for the price to drop', extraSpend: 50 },
      { label: 'My current phone works fine', extraSpend: 0 },
    ],
  },
  {
    id: 'travel',
    q: 'Your friends are booking a group trip to Europe — $1,800 all-in.',
    sub: 'That\'s one extra trip above your current travel budget.',
    options: [
      { label: 'I\'m in — these experiences matter', extraSpend: 150 },
      { label: 'I\'ll find a cheaper alternative', extraSpend: 50 },
      { label: 'Pass — I\'ll stick to my travel budget', extraSpend: 0 },
    ],
  },
  {
    id: 'gym',
    q: 'There\'s an Equinox 2 blocks from your office. Your current gym is 20 min away.',
    sub: 'Equinox: $250/mo. Your current gym: ~$60/mo.',
    options: [
      { label: 'I\'d switch — convenience is worth it', extraSpend: 190 },
      { label: 'My current gym is fine', extraSpend: 0 },
    ],
  },
];

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtK(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}k`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-xs space-y-1">
      <p className="font-semibold text-slate-700">Year {label} (age {22 + label})</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtK(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function LifestyleInflation({ onFinish, budgetSurplus }) {
  const [qIdx, setQIdx] = useState(0);
  const [selections, setSelections] = useState([]); // [extraSpend per question]
  const [done, setDone] = useState(false);

  function pick(extraSpend) {
    const next = [...selections, extraSpend];
    setSelections(next);
    if (qIdx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setQIdx(qIdx + 1);
    }
  }

  const totalExtraSpend = selections.reduce((s, v) => s + v, 0);
  const invested = RAISE_MONTHLY - totalExtraSpend;
  const avgInvested = Math.round(RAISE_MONTHLY * AVERAGE_SAVED_RATE);

  const YEARS = [5, 10, 20, 30, 40];

  const chartData = useMemo(() => YEARS.map((y) => ({
    year: y,
    'Invest all of raise': Math.round(futureValue(RAISE_MONTHLY, 0.07, y)),
    'Your choices': Math.round(futureValue(Math.max(0, invested), 0.07, y)),
    'Average American': Math.round(futureValue(avgInvested, 0.07, y)),
  })), [invested, avgInvested]);

  if (!done) {
    const q = QUESTIONS[qIdx];
    const progress = ((qIdx + 1) / QUESTIONS.length) * 100;

    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Fix D: surplus-aware framing */}
        {budgetSurplus !== undefined && budgetSurplus < 200 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-900">Your current budget is already tight.</p>
            <p className="text-sm text-amber-700 mt-1">
              You left Grade 10 with <strong>{fmt(Math.max(0, budgetSurplus))}/mo</strong> in surplus.
              A raise would feel like relief — and that's exactly when spending creeps up fastest.
            </p>
            <p className="text-xs text-amber-600 mt-1">Answer these honestly. No one is watching.</p>
          </div>
        )}

        {/* Frame */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-bold text-emerald-900">You just got promoted 🎉</p>
          <p className="text-sm text-emerald-700 mt-1">
            Salary: $72,500 → <strong>$85,000</strong>. That's{' '}
            <strong>{fmt(RAISE_MONTHLY)}/mo more</strong> in your pocket after taxes.
          </p>
          <p className="text-xs text-emerald-600 mt-2">
            What do you do with it? Answer honestly.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Question {qIdx + 1} of {QUESTIONS.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{q.q}</h2>
            <p className="text-slate-500 text-sm mt-1">{q.sub}</p>
          </div>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(opt.extraSpend)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50 transition-all active:scale-[0.99]"
              >
                <span className="text-sm font-medium text-slate-800">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Reveal ──────────────────────────────────────────────────────────────
  const pctSpent = Math.round((totalExtraSpend / RAISE_MONTHLY) * 100);
  const difference30yr = futureValue(RAISE_MONTHLY, 0.07, 30) - futureValue(Math.max(0, invested), 0.07, 30);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <div>
        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Lifestyle Inflation</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">What you did with your raise</h2>
      </div>

      {/* Reveal card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-slate-300 text-sm">Raise (take-home)</p>
          <p className="font-bold">{fmt(RAISE_MONTHLY)}/mo</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-red-300 text-sm">You spent</p>
          <p className="font-bold text-red-300">− {fmt(totalExtraSpend)}/mo ({pctSpent}%)</p>
        </div>
        <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
          <p className="text-emerald-300 text-sm font-semibold">You're investing</p>
          <p className="font-bold text-emerald-300 text-lg">{fmt(Math.max(0, invested))}/mo</p>
        </div>
      </div>

      {/* Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
        <p className="text-sm font-bold text-blue-900">How you compare</p>
        <p className="text-xs text-blue-700">
          Research shows the average American spends{' '}
          <strong>$0.73 of every $1 raise</strong> within 12 months — you spent{' '}
          <strong>${(totalExtraSpend / RAISE_MONTHLY).toFixed(2)} of every $1</strong>.
        </p>
        <p className="text-xs text-blue-500">
          Source: Federal Reserve Survey of Consumer Finances, 2022
        </p>
      </div>

      {/* Chart */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">
          What your raise-investing does over 30 years at 7%
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="year" tickFormatter={(y) => `${y}yr`} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 10 }} width={42} />
              <ReTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Invest all of raise" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Your choices" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Average American" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {difference30yr > 10000 && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Investing all of your raise vs. your choices: <strong className="text-slate-700">{fmtK(difference30yr)} difference</strong> at age 52
          </p>
        )}
      </div>

      {/* Fix M: Grade 10 → 11 bridge card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-1">
        <p className="text-sm font-bold text-indigo-900">That's Grade 10.</p>
        {budgetSurplus !== undefined && budgetSurplus > 0 ? (
          <p className="text-sm text-indigo-700">
            You're leaving this year with <strong>{fmt(budgetSurplus)}/mo surplus</strong> from your budget.
            Next year, you figure out where that money goes — and what it becomes.
          </p>
        ) : (
          <p className="text-sm text-indigo-700">
            Your budget was tight. Next year, you'll learn why even <strong>small amounts invested early</strong> can grow into something big.
          </p>
        )}
        <p className="text-xs text-indigo-500 mt-1">Grade 11: Compound Interest &amp; Investing →</p>
      </div>

      <button
        onClick={onFinish}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        Go to Grade 11: Investing →
      </button>
    </div>
  );
}
