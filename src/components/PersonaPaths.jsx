import { useState, useMemo } from 'react';
import { computeTaxBreakdown } from '../data/taxConstants';
import { CAREERS, HIGH_SAVER_RATE, LOW_SAVER_RATE } from '../data/careers';
import { futureValue } from '../utils/finance';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

const RETIRE_AGE = 62;
const START_CHART_AGE = 22;
const ANNUAL_RATE = 0.07;

function fmtK(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}k`;
}

// Compute full wealth timeline (ages 22–62) for a career × saver rate.
// Before startAge: wealth = 0. After: variable contributions based on salary curve.
function computeTimeline(career, saverRate) {
  const monthlyRate = (1 + ANNUAL_RATE) ** (1 / 12) - 1;
  let portfolio = 0;
  const points = [];
  for (let age = START_CHART_AGE; age <= RETIRE_AGE; age++) {
    points.push({ age, wealth: Math.round(portfolio) });
    if (age >= career.startAge && age < RETIRE_AGE) {
      const yearIdx = Math.min(age - career.startAge, career.salaryByYear.length - 1);
      const { takeHomeMonthly } = computeTaxBreakdown(career.salaryByYear[yearIdx]);
      const mc = Math.round(takeHomeMonthly * saverRate);
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyRate) + mc;
      }
    }
  }
  return points;
}

function wealthAt62(career, saverRate) {
  const yearIdx = Math.min(RETIRE_AGE - career.startAge, career.salaryByYear.length - 1);
  if (yearIdx <= 0) return 0;
  return computeTimeline(career, saverRate).at(-1)?.wealth ?? 0;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-xs space-y-1">
      <p className="font-semibold text-slate-700">Age {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtK(p.value)}
        </p>
      ))}
    </div>
  );
}

function CareerCard({ career, selected, onToggle, disabled, saverRate }) {
  const wealth = useMemo(() => wealthAt62(career, saverRate), [career, saverRate]);
  const monthlyAtPeak = useMemo(() => {
    const peakSalary = career.salaryByYear[career.salaryByYear.length - 1];
    const { takeHomeMonthly } = computeTaxBreakdown(peakSalary);
    return Math.round(takeHomeMonthly * saverRate);
  }, [career, saverRate]);

  return (
    <button
      onClick={() => !disabled && onToggle(career.id)}
      disabled={disabled}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
        selected
          ? 'bg-white shadow-md'
          : disabled
          ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
      style={selected ? { borderColor: career.color } : {}}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{career.icon}</span>
            <p className="font-bold text-slate-900 text-sm">{career.label}</p>
          </div>
          <p className="text-xs text-slate-500 leading-snug">{career.story}</p>
          <p className="text-xs text-slate-400 mt-0.5">Starts investing at age {career.startAge}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400">{career.salaryRange}</p>
          <p className="font-bold mt-1" style={{ color: career.color }}>{fmtK(wealth)}</p>
          <p className="text-xs text-slate-400">at 62</p>
        </div>
      </div>
    </button>
  );
}

export default function PersonaPaths({ onDone }) {
  const [selected, setSelected] = useState(['educator', 'physician']);
  const [saverMode, setSaverMode] = useState('mixed');

  // saverMode: 'high' | 'low' | 'mixed' (first=high, second=low)
  function getSaverRateFor(careerIdx) {
    if (saverMode === 'high') return HIGH_SAVER_RATE;
    if (saverMode === 'low') return LOW_SAVER_RATE;
    return careerIdx === 0 ? HIGH_SAVER_RATE : LOW_SAVER_RATE;
  }

  function toggleCareer(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].slice(-2)
    );
  }

  const selectedCareers = selected.map((id) => CAREERS.find((c) => c.id === id)).filter(Boolean);

  // Chart data: age 22–62
  const chartData = useMemo(() => {
    const timelines = selectedCareers.map((career, i) => computeTimeline(career, getSaverRateFor(i)));
    return Array.from({ length: RETIRE_AGE - START_CHART_AGE + 1 }, (_, i) => {
      const age = START_CHART_AGE + i;
      const point = { age };
      selectedCareers.forEach((career, ci) => {
        const key = `${career.label}${saverMode === 'mixed' ? (ci === 0 ? ' (H)' : ' (L)') : ''}`;
        point[key] = timelines[ci][i]?.wealth ?? 0;
      });
      return point;
    });
  }, [selected, saverMode]);

  // Comparison callout
  const callout = useMemo(() => {
    if (selectedCareers.length !== 2) return null;
    const [c0, c1] = selectedCareers;
    const w0 = wealthAt62(c0, getSaverRateFor(0));
    const w1 = wealthAt62(c1, getSaverRateFor(1));
    const [winner, loser] = w0 >= w1 ? [c0, c1] : [c1, c0];
    const [wWin, wLose] = w0 >= w1 ? [w0, w1] : [w1, w0];
    const winnerIdx = w0 >= w1 ? 0 : 1;
    const loserIdx = 1 - winnerIdx;
    const winnerMode = getSaverRateFor(winnerIdx) === HIGH_SAVER_RATE ? 'high saver' : 'low saver';
    const loserMode = getSaverRateFor(loserIdx) === HIGH_SAVER_RATE ? 'high saver' : 'low saver';
    const startDiff = Math.abs(c0.startAge - c1.startAge);

    if (startDiff >= 4 && winner.startAge < loser.startAge) {
      return {
        headline: `${winner.label} (${winnerMode}) wins — starts ${startDiff} years earlier.`,
        body: `${loser.label} earns more, but starting at ${loser.startAge} vs ${winner.startAge} is an enormous disadvantage. At 62: ${fmtK(wWin)} vs ${fmtK(wLose)}. Time beats income.`,
        color: winner.color,
      };
    }
    return {
      headline: `${winner.label} (${winnerMode}): ${fmtK(wWin)} · ${loser.label} (${loserMode}): ${fmtK(wLose)} at 62`,
      body: `${winner.label} starts at ${winner.startAge}. ${loser.label} starts at ${loser.startAge}.`,
      color: winner.color,
    };
  }, [selected, saverMode]);

  const chartKeys = selectedCareers.map((career, ci) => ({
    key: `${career.label}${saverMode === 'mixed' ? (ci === 0 ? ' (H)' : ' (L)') : ''}`,
    color: career.color,
  }));

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm font-bold text-indigo-900">Time beats money — every time.</p>
        <p className="text-sm text-indigo-700 mt-1">
          <span className="font-bold">$150/month from age 22 at 7% real = {fmtK(futureValue(150, 0.07, 40))}</span> at 62.
        </p>
        <p className="text-xs text-indigo-500 mt-1">
          Less than a daily coffee ($6.50 avg NYC). The amount matters less than starting.
        </p>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm font-bold text-slate-800">Pick two careers to compare</p>
        <p className="text-xs text-slate-500 mt-0.5">
          All invest in a 7% real index fund (10% nominal − 3% inflation). Values in today's dollars.
        </p>
      </div>

      {/* Saver mode toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-600">Saver type</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'mixed', label: 'Mixed', sub: '1st: high · 2nd: low' },
            { id: 'high',  label: 'Both high savers', sub: '20% of take-home' },
            { id: 'low',   label: 'Both low savers', sub: '5% of take-home' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSaverMode(opt.id)}
              className={`rounded-lg py-2 px-2 text-center text-xs font-semibold border transition-all ${
                saverMode === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="leading-tight">{opt.label}</div>
              <div className={`text-xs mt-0.5 leading-tight ${saverMode === opt.id ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.sub}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          "Mixed" shows the most powerful lesson: a high-saving lower-earner vs. a low-saving high-earner.
        </p>
      </div>

      {/* Career cards */}
      <div className="space-y-2">
        {CAREERS.map((career) => (
          <CareerCard
            key={career.id}
            career={career}
            selected={selected.includes(career.id)}
            onToggle={toggleCareer}
            disabled={!selected.includes(career.id) && selected.length >= 2}
            saverRate={(() => {
              const idx = selected.indexOf(career.id);
              if (idx === -1) return getSaverRateFor(0);
              return getSaverRateFor(idx);
            })()}
          />
        ))}
      </div>

      {/* Chart */}
      {selectedCareers.length === 2 && (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: 'Age', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
                <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 10 }} width={48} />
                <ReTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {chartKeys.map((ck) => (
                  <Line key={ck.key} type="monotone" dataKey={ck.key} stroke={ck.color} strokeWidth={2.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {callout && (
            <div className="rounded-xl p-4 border-l-4 bg-slate-50" style={{ borderColor: callout.color }}>
              <p className="text-sm font-bold text-slate-900">{callout.headline}</p>
              <p className="text-xs text-slate-600 mt-1">{callout.body}</p>
            </div>
          )}

          {/* RSU note for relevant careers */}
          {selectedCareers.some((c) => c.RSU || c.bonusHeavy) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800">
                <strong>Note on finance/tech careers:</strong> RSUs and bonuses are included in salary curves above, but create concentration risk — all eggs in one basket.{' '}
                JL Collins' advice: sell RSUs immediately when they vest, buy index fund. Concentration is how fortunes are lost, not built.
              </p>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-center text-slate-400 px-4">
        All values in today's purchasing power (7% real = 10% nominal − 3% inflation). Salary curves are pedagogically approximate.
      </p>

      {/* Transition */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500 text-center mb-3">
          Now plug in your own numbers — from your 10th grade budget.
        </p>
        <button
          onClick={onDone}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Build my own scenario →
        </button>
      </div>
    </div>
  );
}
