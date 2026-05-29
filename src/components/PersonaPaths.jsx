import { useState, useMemo } from 'react';
import { futureValue } from '../utils/finance';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Character profiles ────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: 'maya',
    name: 'Maya',
    job: 'Electrician',
    color: '#6366f1',
    startAge: 22,
    monthlyAmount: 350,
    story: 'Starts her union apprenticeship right after high school. No college debt. Saves $350/mo from day one.',
    incomeNote: '~$58k starting, grows to $85k by 40',
  },
  {
    id: 'sam',
    name: 'Sam',
    job: 'Elementary School Teacher',
    color: '#10b981',
    startAge: 22,
    monthlyAmount: 200,
    story: 'Gets a teaching degree, starts at $52k. Budget is tight but saves $200/mo consistently — always.',
    incomeNote: '~$52k starting, grows to $68k by 40',
  },
  {
    id: 'jordan',
    name: 'Jordan',
    job: 'Software Engineer',
    color: '#f59e0b',
    startAge: 32,
    monthlyAmount: 600,
    story: 'Earns $130k but lifestyle inflates fast in NYC. Doesn\'t get serious about saving until 32.',
    incomeNote: '~$130k salary. Saves $600/mo starting at 32.',
  },
  {
    id: 'alex',
    name: 'Alex',
    job: 'Physician',
    color: '#ef4444',
    startAge: 35,
    monthlyAmount: 2000,
    story: 'Med school + residency = 13 years of training and debt. Finally starts investing at 35 with a high salary.',
    incomeNote: '~$280k salary. Saves $2,000/mo starting at 35.',
  },
];

const RETIRE_AGE = 62;

function fmtK(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}k`;
}

function wealthAt(persona, age) {
  if (age <= persona.startAge) return 0;
  const years = age - persona.startAge;
  return futureValue(persona.monthlyAmount, 0.07, years);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-xs space-y-1">
      <p className="font-semibold text-slate-700">Age {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmtK(p.value)}</p>
      ))}
    </div>
  );
}

// ── Persona card ──────────────────────────────────────────────────────────

function PersonaCard({ persona, selected, onToggle, selectionCount }) {
  const wealth = wealthAt(persona, RETIRE_AGE);
  const yearsInvesting = RETIRE_AGE - persona.startAge;
  const isDisabled = !selected && selectionCount >= 2;

  return (
    <button
      onClick={() => !isDisabled && onToggle(persona.id)}
      disabled={isDisabled}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        selected
          ? 'border-2 bg-white shadow-md'
          : isDisabled
          ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
      style={selected ? { borderColor: persona.color } : {}}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: persona.color }} />
            <p className="font-bold text-slate-900 text-sm">{persona.name}</p>
            <span className="text-xs text-slate-500">{persona.job}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-snug">{persona.story}</p>
          <p className="text-xs text-slate-400 mt-1">{persona.incomeNote}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500">Starts saving</p>
          <p className="font-bold text-slate-800">age {persona.startAge}</p>
          <p className="text-xs text-slate-500 mt-1">${persona.monthlyAmount}/mo</p>
          <p className="font-bold mt-1" style={{ color: persona.color }}>{fmtK(wealth)}</p>
          <p className="text-xs text-slate-400">at 62</p>
        </div>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function PersonaPaths({ onDone }) {
  const [selected, setSelected] = useState(['maya', 'jordan']);

  function togglePersona(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].slice(-2)
    );
  }

  const selectedPersonas = PERSONAS.filter((p) => selected.includes(p.id));

  // Build chart data: age 22 → 62
  const ages = Array.from({ length: 41 }, (_, i) => 22 + i);
  const chartData = useMemo(() =>
    ages.map((age) => {
      const point = { age };
      selectedPersonas.forEach((p) => {
        point[p.name] = Math.round(wealthAt(p, age));
      });
      return point;
    }), [selected]
  );

  // Comparison callout
  const [p1, p2] = selectedPersonas;
  const callout = useMemo(() => {
    if (!p1 || !p2) return null;
    const w1 = wealthAt(p1, RETIRE_AGE);
    const w2 = wealthAt(p2, RETIRE_AGE);
    const [winner, loser] = w1 >= w2 ? [p1, p2] : [p2, p1];
    const wWin = Math.max(w1, w2);
    const wLose = Math.min(w1, w2);
    const startDiff = Math.abs(p1.startAge - p2.startAge);
    const amtDiff = Math.abs(p1.monthlyAmount - p2.monthlyAmount);
    const higherEarner = p1.monthlyAmount > p2.monthlyAmount ? p1 : p2;
    const earlierStarter = p1.startAge < p2.startAge ? p1 : p2;

    if (earlierStarter.id === winner.id && startDiff >= 5) {
      return {
        headline: `${winner.name} wins — by starting ${startDiff} years earlier.`,
        body: `${loser.name} saves $${loser.monthlyAmount}/mo. ${winner.name} saves $${winner.monthlyAmount}/mo. At 62: ${winner.name} has ${fmtK(wWin)}, ${loser.name} has ${fmtK(wLose)}. Time beats money.`,
        color: winner.color,
      };
    }
    if (higherEarner.id !== winner.id) {
      return {
        headline: `${winner.name} wins — despite saving less per month.`,
        body: `${loser.name} saves $${loser.monthlyAmount}/mo but started at ${loser.startAge}. ${winner.name} saves $${winner.monthlyAmount}/mo but started at ${winner.startAge}. Starting early made the difference: ${fmtK(wWin)} vs ${fmtK(wLose)}.`,
        color: winner.color,
      };
    }
    return {
      headline: `${winner.name}: ${fmtK(wWin)} · ${loser.name}: ${fmtK(wLose)} at age 62`,
      body: `${winner.name} saves $${winner.monthlyAmount}/mo from ${winner.startAge}. ${loser.name} saves $${loser.monthlyAmount}/mo from ${loser.startAge}.`,
      color: winner.color,
    };
  }, [selected]);

  return (
    <div className="space-y-5">
      {/* "How little you need" banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm font-bold text-indigo-900">How little do you actually need to save?</p>
        <p className="text-sm text-indigo-700 mt-1">
          <span className="font-bold">$5/day = $150/month.</span>
          {' '}Invested from age 22 at 7%:{' '}
          <span className="font-bold">{fmtK(futureValue(150, 0.07, 40))} by age 62.</span>
        </p>
        <p className="text-xs text-indigo-500 mt-1">
          That's less than a daily latte ($6.50 avg in NYC). The amount matters less than starting.
        </p>
      </div>

      {/* Section header */}
      <div>
        <p className="text-sm font-bold text-slate-800">Compare two paths</p>
        <p className="text-xs text-slate-500 mt-0.5">Select any 2 people below. All invest in a 7% index fund.</p>
      </div>

      {/* Persona cards */}
      <div className="space-y-2">
        {PERSONAS.map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            selected={selected.includes(p.id)}
            onToggle={togglePersona}
            selectionCount={selected.length}
          />
        ))}
      </div>

      {/* Chart */}
      {selectedPersonas.length === 2 && (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="age" tickFormatter={(a) => `${a}`} tick={{ fontSize: 10 }} label={{ value: 'Age', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
                <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 10 }} width={44} />
                <ReTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {selectedPersonas.map((p) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.name}
                    stroke={p.color}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Callout */}
          {callout && (
            <div className="rounded-xl p-4 border-l-4 bg-slate-50" style={{ borderColor: callout.color }}>
              <p className="text-sm font-bold text-slate-900">{callout.headline}</p>
              <p className="text-xs text-slate-600 mt-1">{callout.body}</p>
            </div>
          )}
        </>
      )}

      {/* Transition to custom simulator */}
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
