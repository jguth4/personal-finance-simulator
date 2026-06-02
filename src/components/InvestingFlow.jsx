import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAKE_HOME_MONTHLY, CONTRIBUTION_LIMITS } from '../data/taxConstants';
import { futureValue, debtPayoffMonths } from '../utils/finance';
import TimeChart from './TimeChart';
import Tooltip from './Tooltip';
import PersonaPaths from './PersonaPaths';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// 7% real (inflation-adjusted) + ~10% nominal — always show both
const RETURN_PRESETS = [
  {
    label: 'HYSA',
    rate: 0.045,
    nominalNote: null,
    description: 'High-yield savings account (~4.5%). Zero market risk. But barely beats inflation — this is saving, not investing. Good for emergency funds; not for long-term wealth.',
  },
  {
    label: 'Bonds',
    rate: 0.05,
    nominalNote: null,
    description: 'Bond index fund (~5%). Lower risk than stocks. Usually paired with stocks for stability near retirement.',
  },
  {
    label: 'Index fund',
    rate: 0.07,
    nominalNote: '~10% nominal',
    description: 'VTSAX — Vanguard Total Stock Market Index Fund. Owns ~4,000 US companies at once. The stock market returns ~10%/yr in dollar terms (nominal), but inflation erodes ~3%/yr — so your real purchasing power grows at 7%/yr. Every dollar shown here is in today\'s dollars. Single-year swings: −37% to +32%. JL Collins\'s specific recommendation in The Simple Path to Wealth.',
  },
  {
    label: 'Aggressive',
    rate: 0.10,
    nominalNote: null,
    description: 'Growth stocks / 100% equity (~10% avg nominal, ~7% real). Highest long-run returns. In 2008: −50%. In 2022: −20%. Only if you can stomach the drops without selling.',
  },
];

const YEARS = [3, 5, 10, 20, 30, 40];

const PERSONAS_REF = [
  { id: 'sam',    name: 'Sam',   job: 'Elementary teacher',  monthlyAmount: 200, startAge: 22 },
  { id: 'maya',   name: 'Maya',  job: 'Electrician',         monthlyAmount: 350, startAge: 22 },
  { id: 'jordan', name: 'Jordan', job: 'Software engineer',  monthlyAmount: 600, startAge: 32 },
  { id: 'alex',   name: 'Alex',  job: 'Physician',           monthlyAmount: 2000, startAge: 35 },
];

function closestPersona(surplus) {
  return PERSONAS_REF.reduce((best, p) =>
    Math.abs(p.monthlyAmount - surplus) < Math.abs(best.monthlyAmount - surplus) ? p : best
  );
}

// Chapter unlock timer badge
function UnlockBadge({ secondsLeft }) {
  return (
    <p className="text-xs text-slate-400 text-center">
      Continue in <span className="font-semibold text-slate-600">{secondsLeft}s</span>
    </p>
  );
}

// Chapter header with number + title
function ChapterHeader({ num, title, subtitle }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Chapter {num}</p>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function InvestingFlow({ budgetSurplus, budgetTotalSpent, budgetHealthTier }) {
  const navigate = useNavigate();
  // ── Chapter progression ──────────────────────────────────────────────────
  const [chapter, setChapter] = useState(1);
  const [ch2Unlocked, setCh2Unlocked] = useState(false);
  const [ch3Unlocked, setCh3Unlocked] = useState(false);
  const [ch2SecondsLeft, setCh2SecondsLeft] = useState(20);
  const [ch3SecondsLeft, setCh3SecondsLeft] = useState(15);

  // PersonaPaths state
  const [showPaths, setShowPaths] = useState(true);
  const [personaBanner, setPersonaBanner] = useState(null);

  // ── Investing inputs ─────────────────────────────────────────────────────
  const [surplus, setSurplus] = useState(budgetSurplus ?? 300);
  const [debtBalance, setDebtBalance] = useState(3000);
  const [debtRate, setDebtRate] = useState(0.24);

  // Chapter 3 — no defaults, must be actively selected
  const [investRateIdx, setInvestRateIdx] = useState(null);
  const [expenseRatio, setExpenseRatio] = useState(null);
  const [accountType, setAccountType] = useState(null);

  const [matchEnabled, setMatchEnabled] = useState(true);
  const [horizon, setHorizon] = useState(30);

  const ch3Complete = investRateIdx !== null && expenseRatio !== null && accountType !== null;

  // Use index fund rate as fallback for Ch1/Ch2 preview (before Ch3 selection)
  const investRate = investRateIdx !== null ? RETURN_PRESETS[investRateIdx].rate : 0.07;
  const netRate = Math.max(0, investRate - (expenseRatio ?? 0));
  const TAX_MULT = { roth: 1.0, traditional: 0.75, taxable: 0.85 };
  const taxMult = (accountType && TAX_MULT[accountType]) ?? 1.0;

  const SALARY = 72500;
  const MATCH_CAP_ANNUAL = SALARY * 0.03;
  const matchMonthly = matchEnabled ? Math.min(surplus, MATCH_CAP_ANNUAL / 12) : 0;
  const effectiveMonthly = surplus + matchMonthly;

  const monthlyInterest = debtBalance > 0 ? debtBalance * (debtRate / 12) : 0;
  const debtPayment = Math.min(surplus, debtBalance > 0 ? Math.max(25, monthlyInterest + 50) : 0);
  const payoffMonths = debtPayoffMonths(debtBalance, debtRate, debtPayment);

  // Scenarios (Ch3 only uses actual selections)
  const scenarioA = useMemo(() => futureValue(surplus, 0.005, horizon), [surplus, horizon]);
  const scenarioB = useMemo(() => futureValue(effectiveMonthly, netRate, horizon) * taxMult, [effectiveMonthly, netRate, horizon, taxMult]);
  const scenarioC = useMemo(() => {
    if (debtBalance <= 0 || payoffMonths === Infinity) return futureValue(effectiveMonthly, netRate, horizon) * taxMult;
    const debtYears = payoffMonths / 12;
    if (debtYears >= horizon) return 0;
    const effectiveFull = matchEnabled ? surplus + Math.min(surplus, MATCH_CAP_ANNUAL / 12) : surplus;
    return futureValue(effectiveFull, netRate, horizon - debtYears) * taxMult;
  }, [debtBalance, debtRate, payoffMonths, surplus, netRate, horizon, matchEnabled, taxMult]);

  const rothValue = useMemo(() => futureValue(effectiveMonthly, netRate, horizon), [effectiveMonthly, netRate, horizon]);
  const traditionalValue = useMemo(() => rothValue * 0.75, [rothValue]);

  const lateStartValue = useMemo(() => {
    const remaining = horizon - 10;
    return remaining > 0 ? futureValue(effectiveMonthly, 0.07, remaining) : 0;
  }, [effectiveMonthly, horizon]);

  const chartData = useMemo(() => YEARS.filter((y) => y <= horizon + 1).map((y) => ({
    year: y,
    age: 22 + y,
    doNothing: Math.round(futureValue(surplus, 0.005, y)),
    investNow: Math.round(futureValue(effectiveMonthly, netRate, y) * taxMult),
    payDebtFirst: (() => {
      if (debtBalance <= 0) return Math.round(futureValue(effectiveMonthly, netRate, y) * taxMult);
      const dm = payoffMonths / 12;
      if (dm >= y) return 0;
      const eff = matchEnabled ? surplus + Math.min(surplus, MATCH_CAP_ANNUAL / 12) : surplus;
      return Math.round(futureValue(eff, netRate, y - dm) * taxMult);
    })(),
  })), [surplus, effectiveMonthly, netRate, debtBalance, payoffMonths, horizon, matchEnabled, taxMult]);

  // ── Chapter 1 timer → unlock Ch2 ────────────────────────────────────────
  useEffect(() => {
    if (chapter !== 1 || showPaths) return;
    if (ch2Unlocked) return;
    const done = setTimeout(() => setCh2Unlocked(true), 20000);
    const tick = setInterval(() => setCh2SecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { clearTimeout(done); clearInterval(tick); };
  }, [chapter, showPaths, ch2Unlocked]);

  // ── Chapter 2 timer → unlock Ch3 ────────────────────────────────────────
  useEffect(() => {
    if (chapter !== 2 || ch3Unlocked) return;
    const done = setTimeout(() => setCh3Unlocked(true), 15000);
    const tick = setInterval(() => setCh3SecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { clearTimeout(done); clearInterval(tick); };
  }, [chapter, ch3Unlocked]);

  function handlePathsDone() {
    const persona = closestPersona(surplus);
    setPersonaBanner(persona);
    setShowPaths(false);
  }

  // ── Chapter 1: Start now vs. wait ───────────────────────────────────────
  const ch1StartNow  = useMemo(() => futureValue(surplus, 0.07, horizon), [surplus, horizon]);
  const ch1WaitTen  = useMemo(() => {
    const r = horizon - 10;
    return r > 0 ? futureValue(surplus, 0.07, r) : 0;
  }, [surplus, horizon]);
  const ch1Gap = ch1StartNow - ch1WaitTen;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      {/* Page header */}
      <div className="mb-5">
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-0.5">Grade 11 · Compound Interest</p>
        <h2 className="text-xl font-bold text-slate-900">What happens to your money over time?</h2>
      </div>

      {budgetSurplus !== null && budgetSurplus > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-emerald-800 text-sm font-semibold mb-1">From your Grade 10 budget</p>
          <div className="flex gap-4 text-sm text-emerald-800">
            <span>Take-home: <strong>{fmtFull(TAKE_HOME_MONTHLY)}/mo</strong></span>
            {budgetTotalSpent != null && <span>Spending: <strong>{fmtFull(budgetTotalSpent)}/mo</strong></span>}
            <span>Surplus: <strong>{fmtFull(budgetSurplus)}/mo ← your investing amount</strong></span>
          </div>
          <p className="text-emerald-600 text-xs mt-1">This is your actual money, not a hypothetical.</p>
        </div>
      )}
      {budgetSurplus !== null && budgetSurplus <= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-amber-800 text-sm font-medium">
            Your 10th grade budget left no surplus. Use the slider to explore what even a small amount can do.
          </p>
        </div>
      )}

      {/* PersonaPaths — shown first, collapses when student is ready */}
      {showPaths ? (
        <PersonaPaths onDone={handlePathsDone} />
      ) : (
        <>
          <button
            onClick={() => setShowPaths(true)}
            className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 text-center mb-4"
          >
            ↑ Show character comparisons again
          </button>

          {/* Persona matching banner */}
          {personaBanner && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm font-semibold text-indigo-900">
                Your {fmtFull(surplus)}/mo surplus puts you closest to <span style={{ color: '#6366f1' }}>{personaBanner.name}</span> — the {personaBanner.job}.
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">
                {personaBanner.startAge === 22
                  ? `${personaBanner.name} starts at 22. So do you. Every year you wait shrinks your final number.`
                  : `${personaBanner.name} starts at ${personaBanner.startAge}. You're younger — that gap is worth more than you think.`}
              </p>
            </div>
          )}

          {/* ── CHAPTER 1: Start now vs. wait ── */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 space-y-4 mb-5">
            <ChapterHeader
              num={1}
              title="Start now vs. wait 10 years"
              subtitle="Same amount. Same rate. Only the start date changes."
            />

            {/* Two-column comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Start at 22</p>
                <p className="text-3xl font-bold text-emerald-700">{fmt(ch1StartNow)}</p>
                <p className="text-xs text-emerald-600 mt-1">at age {22 + horizon}</p>
                <p className="text-xs text-emerald-500 mt-0.5">{fmtFull(surplus)}/mo · {horizon} yrs · 7% real (10% nominal)</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">Wait until 32</p>
                <p className="text-3xl font-bold text-slate-500">{fmt(ch1WaitTen)}</p>
                <p className="text-xs text-slate-400 mt-1">at age {22 + horizon}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fmtFull(surplus)}/mo · {horizon - 10} yrs · 7% real (10% nominal)</p>
              </div>
            </div>

            {ch1Gap > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-orange-900">
                  Waiting 10 years costs you <span className="text-orange-700">{fmt(ch1Gap)}</span>
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  Same {fmtFull(surplus)}/mo. Same 7% return. Just 10 fewer years of compounding.
                </p>
              </div>
            )}

            <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              <strong className="text-slate-600">Why 7% real (10% nominal)?</strong> The US stock market returns ~10%/yr in nominal (dollar) terms — this is the number you'll hear most often. Inflation erodes ~3%/yr. So your real purchasing power grows at ~7%/yr. Every dollar shown above is in <em>today's</em> purchasing power — already inflation-adjusted. Source: CRSP historical S&P 500 total return, 1926–2023.
            </div>

            <div className="pt-1 space-y-2">
              {!ch2Unlocked ? (
                <UnlockBadge secondsLeft={ch2SecondsLeft} />
              ) : chapter === 1 ? (
                <button
                  onClick={() => setChapter(2)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  Continue: What if you saved more? →
                </button>
              ) : null}
            </div>
          </div>

          {/* ── CHAPTER 2: What if you saved more? ── */}
          {chapter >= 2 && (
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 space-y-4 mb-5">
              <ChapterHeader
                num={2}
                title="How much you invest matters — but less than when you start"
                subtitle="Drag the slider. Notice that doubling your monthly amount exactly doubles the final number. Time is the non-linear variable, not dollars."
              />

              {/* Surplus slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800 flex items-center">
                    Monthly investment
                    <Tooltip text="Money left after all your monthly expenses. Drag to explore different amounts." />
                  </label>
                  <span className="text-indigo-700 font-bold">{fmtFull(surplus)}</span>
                </div>
                <input
                  type="range" min={50} max={TAKE_HOME_MONTHLY} step={25} value={surplus}
                  onChange={(e) => setSurplus(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>$50/mo</span>
                  <span>{fmtFull(TAKE_HOME_MONTHLY)} (full take-home)</span>
                </div>
              </div>

              {/* Contribution comparison — 3 columns */}
              {(() => {
                const half = Math.max(50, Math.round(surplus / 2));
                const double = Math.min(TAKE_HOME_MONTHLY, surplus * 2);
                const fvHalf   = futureValue(half,   0.07, horizon);
                const fvNow    = futureValue(surplus, 0.07, horizon);
                const fvDouble = futureValue(double,  0.07, horizon);
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">At age {22 + horizon} — all at 7% real return</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: `${fmt(half)}/mo`, val: fvHalf, note: 'Half' },
                        { label: `${fmt(surplus)}/mo`, val: fvNow, note: 'Current' },
                        { label: `${fmt(double)}/mo`, val: fvDouble, note: 'Double' },
                      ].map((s) => (
                        <div key={s.note} className={`rounded-xl p-3 ${s.note === 'Current' ? 'bg-indigo-100 border-2 border-indigo-300' : 'bg-slate-50 border border-slate-200'}`}>
                          <p className="text-xs text-slate-500">{s.note}</p>
                          <p className={`text-xs font-medium mt-0.5 ${s.note === 'Current' ? 'text-indigo-700' : 'text-slate-600'}`}>{s.label}</p>
                          <p className={`text-base font-bold mt-1 ${s.note === 'Current' ? 'text-indigo-800' : 'text-slate-700'}`}>{fmt(s.val)}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      Doubling monthly investment = exactly double the final amount. The relationship is perfectly linear in contribution size — the compounding non-linearity applies to <em>time</em>, not dollars. (This is why Chapter 1 matters so much.)
                    </p>
                  </div>
                );
              })()}

              <div className="pt-1 space-y-2">
                {!ch3Unlocked ? (
                  <UnlockBadge secondsLeft={ch3SecondsLeft} />
                ) : chapter === 2 ? (
                  <button
                    onClick={() => setChapter(3)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    Continue: Fees, account type, and what you invest in →
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* ── CHAPTER 3: Full controls ── */}
          {chapter >= 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Chapter 3</p>
                <h3 className="text-lg font-bold text-slate-900">Fees, account type, and what you invest in</h3>
                <p className="text-sm text-slate-500 mt-0.5">Make all three selections to see your personalized outcome.</p>
              </div>
              {ch3Complete && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-emerald-900 font-semibold text-sm">Ready for the investing simulator?</p>
                    <p className="text-emerald-600 text-xs mt-0.5">Apply everything you've learned — 20 real years of market history.</p>
                  </div>
                  <button
                    onClick={() => navigate('/simulation', { state: { budgetSurplus: surplus } })}
                    className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Go to Simulator →
                  </button>
                </div>
              )}

              {/* Two-column layout on lg+ screens */}
              <div className="flex flex-col lg:flex-row gap-5">

                {/* Left column — controls */}
                <div className="flex-1 space-y-4">

                  {/* 401k match — first, most important */}
                  <div className={`border rounded-xl p-4 ${matchEnabled ? 'bg-white border-slate-200' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center">
                          401(k) employer match
                          <Tooltip text="Most employers match your 401k contributions up to 3% of salary — free money added to your account instantly. This is a 100% return on matched dollars before the market does anything." />
                        </p>
                        {matchEnabled ? (
                          <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                            +{fmtFull(Math.round(matchMonthly))}/mo free from employer · 100% instant return
                          </p>
                        ) : (
                          <p className="text-xs text-red-700 font-semibold mt-0.5">
                            ⚠️ You're leaving {fmtFull(Math.round(MATCH_CAP_ANNUAL / 12))}/mo on the table.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setMatchEnabled((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${matchEnabled ? 'bg-indigo-600' : 'bg-red-400'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${matchEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    {!matchEnabled && (
                      <p className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                        Always take the employer match. It's an instant 100% return — no investment can beat free money. Toggle it back on.
                      </p>
                    )}
                  </div>

                  {/* Investment type — no default, required */}
                  <div className={`border rounded-xl p-4 space-y-2 ${investRateIdx === null ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                    <p className="text-sm font-semibold text-slate-800 flex items-center">
                      Investment type
                      {investRateIdx === null && <span className="ml-2 text-xs font-normal text-amber-600">← choose one</span>}
                      <Tooltip text="Higher return = more risk + volatility. Index funds track the whole stock market. Past returns don't guarantee future results." />
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {RETURN_PRESETS.map((p, i) => (
                        <button key={i} onClick={() => setInvestRateIdx(i)}
                          className={`rounded-lg py-2 text-center text-xs font-semibold border transition-all ${
                            investRateIdx === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>{p.label}</div>
                          <div className={`text-xs mt-0.5 ${investRateIdx === i ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {Math.round(p.rate * 100)}%{p.nominalNote ? ' real' : ''}
                          </div>
                          {p.nominalNote && (
                            <div className={`text-xs ${investRateIdx === i ? 'text-indigo-300' : 'text-slate-300'}`}>{p.nominalNote}</div>
                          )}
                        </button>
                      ))}
                    </div>
                    {investRateIdx !== null && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
                        {RETURN_PRESETS[investRateIdx].description}
                      </p>
                    )}
                  </div>

                  {/* Expense ratio — no default, required */}
                  <div className={`border rounded-xl p-4 space-y-2 ${expenseRatio === null ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                    <p className="text-sm font-semibold text-slate-800 flex items-center">
                      Fund expense ratio
                      {expenseRatio === null && <span className="ml-2 text-xs font-normal text-amber-600">← choose one</span>}
                      <Tooltip text="The annual fee a fund charges, silently taken from your returns every year. Index funds charge almost nothing. Actively managed funds charge 30–100x more for the same or worse performance." />
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Index fund', ratio: 0.0004, note: '0.04% · Vanguard VTSAX' },
                        { label: 'Blended', ratio: 0.005, note: '0.50% · Target-date' },
                        { label: 'Actively managed', ratio: 0.01, note: '1.00% · Most mutual funds' },
                      ].map((opt) => (
                        <button key={opt.ratio} onClick={() => setExpenseRatio(opt.ratio)}
                          className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all ${expenseRatio === opt.ratio ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
                          <div className="leading-tight">{opt.label}</div>
                          <div className={`text-xs mt-0.5 leading-tight ${expenseRatio === opt.ratio ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.note}</div>
                        </button>
                      ))}
                    </div>
                    {expenseRatio !== null && investRateIdx !== null && (() => {
                      const feeImpact = futureValue(effectiveMonthly, investRate, horizon) - futureValue(effectiveMonthly, netRate, horizon);
                      return feeImpact > 500 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                          At {(expenseRatio * 100).toFixed(2)}% fees, the fund manager takes <strong>{fmt(feeImpact)}</strong> of your retirement over {horizon} years.
                          {expenseRatio > 0.0004 && <span className="text-amber-700"> VTSAX (0.04%) would keep that for you.</span>}
                          <span className="block text-amber-600 mt-0.5">Source: SmartAsset expense ratio analysis · S&P SPIVA report</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Account type — no default, required */}
                  <div className={`border rounded-xl p-4 space-y-2 ${accountType === null ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                    <p className="text-sm font-semibold text-slate-800 flex items-center">
                      Account type
                      {accountType === null && <span className="ml-2 text-xs font-normal text-amber-600">← choose one</span>}
                      <Tooltip text="Where you invest matters for taxes. Roth: post-tax dollars in, tax-free growth forever. Traditional 401k: pre-tax dollars in, taxed at withdrawal. At 22 you're in your lowest tax bracket ever — Roth is almost always better." />
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'roth',        label: 'Roth IRA',           note: 'Post-tax in · tax-free forever', limit: CONTRIBUTION_LIMITS.ROTH_IRA_ANNUAL },
                        { id: 'traditional', label: 'Traditional 401(k)', note: 'Pre-tax in · taxed at withdrawal', limit: CONTRIBUTION_LIMITS.TRADITIONAL_401K_ANNUAL },
                        { id: 'hsa',         label: 'HSA',                note: 'Triple tax advantage', limit: CONTRIBUTION_LIMITS.HSA_INDIVIDUAL_ANNUAL, requiresHDHP: true },
                        { id: 'taxable',     label: 'Taxable brokerage',  note: 'Post-tax in · gains taxed', limit: null },
                      ].map((opt) => {
                        const isHDHPAvailable = budgetHealthTier === 0;
                        const disabled = opt.requiresHDHP && !isHDHPAvailable;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => !disabled && setAccountType(opt.id)}
                            disabled={disabled}
                            className={`rounded-lg py-2 px-2 text-center text-xs font-semibold border transition-all ${
                              accountType === opt.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : disabled
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="leading-tight">{opt.label}</div>
                            <div className={`text-xs mt-0.5 leading-tight ${accountType === opt.id ? 'text-indigo-200' : disabled ? 'text-slate-300' : 'text-slate-400'}`}>
                              {disabled ? 'Requires HDHP plan' : opt.note}
                            </div>
                            {opt.limit && !disabled && (
                              <div className={`text-xs mt-0.5 ${accountType === opt.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                                Limit: {fmtFull(opt.limit)}/yr
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Contribution limit warning */}
                    {accountType && (() => {
                      const limits = {
                        roth: CONTRIBUTION_LIMITS.ROTH_IRA_ANNUAL,
                        traditional: CONTRIBUTION_LIMITS.TRADITIONAL_401K_ANNUAL,
                        hsa: CONTRIBUTION_LIMITS.HSA_INDIVIDUAL_ANNUAL,
                      };
                      const limit = limits[accountType];
                      if (!limit) return null;
                      const annual = surplus * 12;
                      if (annual > limit) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                            {fmtFull(surplus)}/mo × 12 = <strong>{fmtFull(annual)}/yr</strong> — above the{' '}
                            {accountType === 'roth' ? 'Roth IRA' : accountType === 'traditional' ? '401(k)' : 'HSA'}{' '}
                            limit of <strong>{fmtFull(limit)}/yr</strong>. In real life, excess would go to a taxable brokerage account.
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {accountType === 'roth' && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        You pay taxes on contributions <strong>now</strong> — at your current (likely lowest-ever) bracket. Every dollar of growth is yours, tax-free, forever. No tax on withdrawal, ever.
                      </p>
                    )}
                    {accountType === 'traditional' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-xs text-emerald-700 font-semibold">Roth (pay now)</p>
                            <p className="text-lg font-bold text-emerald-700">{fmt(rothValue)}</p>
                            <p className="text-xs text-emerald-600">100% yours at 62</p>
                          </div>
                          <div>
                            <p className="text-xs text-amber-700 font-semibold">Traditional (pay later)</p>
                            <p className="text-lg font-bold text-amber-700">{fmt(traditionalValue)}</p>
                            <p className="text-xs text-amber-600">after ~25% tax at withdrawal</p>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700 text-center pt-1 border-t border-amber-200">
                          The IRS collects <strong>{fmt(rothValue - traditionalValue)}</strong> at withdrawal. You deferred taxes today but owe them later — at whatever your bracket is then.
                        </p>
                      </div>
                    )}
                    {accountType === 'hsa' && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        <strong>Triple tax advantage:</strong> Pre-tax contributions → tax-free growth → tax-free withdrawals for medical. JL Collins calls this the best retirement account in America. After 65, non-medical withdrawals taxed like Traditional 401k.
                        2025 limit: {fmtFull(CONTRIBUTION_LIMITS.HSA_INDIVIDUAL_ANNUAL)}/yr.
                      </p>
                    )}
                    {accountType === 'taxable' && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                        Post-tax contributions. No annual limits — good for saving beyond IRA/401k limits.
                        Long-term capital gains taxed at 0%, 15%, or 20% when you sell (0% if income &lt; ~$47k/yr, 15% for most, 20% for high earners).
                      </p>
                    )}
                  </div>

                  {/* Debt drag */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 flex items-center">
                        Credit card debt
                        <Tooltip text="High-interest debt. At 24% APR, a $3,000 balance costs ~$60/month in interest alone — money that disappears." />
                      </span>
                      <span className={`font-bold text-sm ${debtBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {debtBalance > 0 ? fmtFull(debtBalance) : 'None'}
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={20000} step={500} value={debtBalance}
                      onChange={(e) => setDebtBalance(Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    {debtBalance > 0 && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-800 space-y-1.5">
                        <p className="font-bold text-red-900">
                          STOP: {debtRate * 100 === Math.round(debtRate * 100) ? debtRate * 100 : (debtRate * 100).toFixed(1)}% APR = a guaranteed {debtRate * 100 === Math.round(debtRate * 100) ? debtRate * 100 : (debtRate * 100).toFixed(1)}% loss. No investment reliably beats it.
                        </p>
                        <p>💸 Monthly interest: <strong>{fmtFull(Math.round(monthlyInterest))}</strong> — money that disappears and builds no wealth.</p>
                        {payoffMonths !== Infinity && (
                          <p>⏱ Payoff time at minimum payment: ~<strong>{payoffMonths < 12 ? `${payoffMonths} months` : `${Math.round(payoffMonths / 12 * 10) / 10} years`}</strong></p>
                        )}
                        {payoffMonths === Infinity && (
                          <p className="font-bold">⚠️ Debt growing faster than you can pay it at this rate.</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Your credit card APR</p>
                      <div className="grid grid-cols-3 gap-1">
                        {[{ label: '15%', rate: 0.15, note: 'Good credit' }, { label: '24%', rate: 0.24, note: 'Average' }, { label: '29.99%', rate: 0.2999, note: 'Store card' }].map((opt) => (
                          <button key={opt.rate} onClick={() => setDebtRate(opt.rate)}
                            className={`rounded-lg py-1.5 text-xs font-semibold border transition-all ${debtRate === opt.rate ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}>
                            <div>{opt.label}</div>
                            <div className={`text-xs ${debtRate === opt.rate ? 'text-red-100' : 'text-slate-400'}`}>{opt.note}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 border border-slate-200">
                        <strong>Avoid carrying credit card debt at all costs.</strong> You can avoid it entirely by always paying the full balance at the end of every month — set up auto-pay.
                        The slider above lets you see how crushing it becomes if you carry a balance.
                      </div>
                    </div>
                  </div>

                  {/* Time horizon */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 flex items-center">
                        Time horizon
                        <Tooltip text="How many years you invest. Starting at 22, a 30-year horizon = age 52. 40 years = age 62." />
                      </p>
                      <span className="text-indigo-700 font-bold">{horizon} years (age {22 + horizon})</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {YEARS.map((y) => (
                        <button key={y} onClick={() => setHorizon(y)}
                          className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            horizon === y ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {y}yr
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column — chart + outcomes (only when all 3 selections made) */}
                <div className="lg:w-96 space-y-4">
                  {!ch3Complete ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-64">
                      <p className="text-slate-400 text-sm font-medium">Chart appears after you select</p>
                      <div className="mt-3 space-y-1.5 text-xs text-left">
                        <p className={investRateIdx !== null ? 'text-emerald-600' : 'text-slate-400'}>
                          {investRateIdx !== null ? '✓' : '○'} Investment type
                        </p>
                        <p className={expenseRatio !== null ? 'text-emerald-600' : 'text-slate-400'}>
                          {expenseRatio !== null ? '✓' : '○'} Expense ratio
                        </p>
                        <p className={accountType !== null ? 'text-emerald-600' : 'text-slate-400'}>
                          {accountType !== null ? '✓' : '○'} Account type
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <TimeChart data={chartData} />

                      {/* Outcome cards */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">At age {22 + horizon}</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">💤 Do nothing (savings account)</p>
                            <p className="text-xs text-slate-400">~0.5% APY, no investing</p>
                          </div>
                          <p className="text-lg font-bold text-slate-500">{fmt(scenarioA)}</p>
                        </div>

                        {debtBalance > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-amber-800">⚡ Pay off debt first, then invest</p>
                              <p className="text-xs text-amber-600">
                                {payoffMonths === Infinity ? 'Never pays off at this rate' : `Debt free in ~${payoffMonths < 12 ? `${payoffMonths}mo` : `${Math.ceil(payoffMonths / 12)}yr`}, then invest`}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-amber-700">{fmt(scenarioC)}</p>
                          </div>
                        )}

                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-indigo-800">🚀 Invest from day one</p>
                            <p className="text-xs text-indigo-600">
                              {fmtFull(surplus)}/mo {matchEnabled ? `+ ${fmtFull(Math.round(matchMonthly))} match` : ''} @ {Math.round(investRate * 100)}% {RETURN_PRESETS[investRateIdx]?.nominalNote ? `real (~10% nominal)` : ''}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-indigo-700">{fmt(scenarioB)}</p>
                        </div>
                      </div>

                      {/* Retirement anchor */}
                      {scenarioB > 10000 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-3">
                          <p className="text-xs font-semibold text-slate-600">What does {fmt(scenarioB)} actually buy in retirement?</p>

                          {/* 4% rule */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-slate-500">4% withdrawal/yr</p>
                              <p className="text-sm font-bold text-slate-800">{fmtFull(Math.round(scenarioB * 0.04))}</p>
                              <p className="text-xs text-slate-400">({fmtFull(Math.round(scenarioB * 0.04 / 12))}/mo)</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">+ Social Security</p>
                              <p className="text-sm font-bold text-slate-800">~$18,000</p>
                              <p className="text-xs text-slate-400">/yr at 62</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Total income/yr</p>
                              <p className="text-sm font-bold text-indigo-700">{fmtFull(Math.round(scenarioB * 0.04 + 18000))}</p>
                              <p className="text-xs text-slate-400">at age {22 + horizon}</p>
                            </div>
                          </div>

                          {/* 4% rule explained */}
                          <div className="text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-slate-200 space-y-1">
                            <p><strong className="text-slate-700">The 4% Rule</strong> (Bengen, 1994): Withdraw 4% of your portfolio in year 1, then adjust for inflation each year. Research shows this survived 95%+ of 30-year retirements historically.</p>
                            <p><strong className="text-slate-700">Social Security</strong>: You earn credits by working and paying payroll taxes. The more you earn over your career, the higher your benefit.
                              At 62 (early): ~$18k/yr. At 67 (full retirement): ~$23k/yr. At 70 (max delay): ~$32k/yr.
                              <span className="text-indigo-500"> Delaying to 70 pays 77% more than claiming at 62.</span> Source: SSA.gov.
                            </p>
                          </div>

                          {/* FIRE number */}
                          {budgetTotalSpent != null && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs">
                              <p className="text-indigo-900 font-semibold mb-0.5">Your FIRE number</p>
                              <p className="text-indigo-700">
                                25 × your annual spending ({fmtFull(budgetTotalSpent * 12)}/yr) ={' '}
                                <strong>{fmtFull(Math.round(budgetTotalSpent * 12 * 25))}</strong>
                              </p>
                              <p className="text-indigo-500 mt-0.5">
                                This is the portfolio that funds your current lifestyle forever at 4% withdrawal.
                                {scenarioB >= budgetTotalSpent * 12 * 25
                                  ? ' ✓ Your projected portfolio exceeds it.'
                                  : ` You need ${fmt(budgetTotalSpent * 12 * 25 - scenarioB)} more.`}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
