import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  TOTAL_YEARS, RETURNS, INFLATION, MARKET_EVENTS, LIFESTYLE_EVENTS,
  REAL_HEADLINES, CALENDAR_YEARS,
} from '../data/marketHistory';
import {
  SIMULATION_STOCKS, MIN_PICKS, MAX_PICKS,
} from '../data/simulationStocks';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function pct(r) { return `${r >= 0 ? '+' : ''}${Math.round(r * 100)}%`; }

const ASSET_LABELS = {
  vtsax:   'Index fund',
  advisor: 'Financial advisor',
  stocks:  'Individual stocks',
  bonds:   'Bond index',
  gold:    'Gold',
  cash:    'Cash / HYSA',
};
const ASSET_COLORS = {
  vtsax: '#6366f1', advisor: '#8b5cf6', stocks: '#f59e0b',
  bonds: '#10b981', gold: '#eab308', cash: '#94a3b8',
};

function getAdvisorReturn(y) {
  return Math.max(-0.999, RETURNS.vtsax[y] - 0.015);
}

function computePortfolioAfterYear(byAsset, allocationPct, monthlyContrib, year, stockPicks) {
  const r = {};
  const assets = ['vtsax', 'advisor', 'bonds', 'gold', 'cash'];
  for (const a of assets) {
    const ret = a === 'advisor' ? getAdvisorReturn(year) : RETURNS[a][year];
    r[a] = (byAsset[a] ?? 0) * (1 + ret) + (monthlyContrib * 12 * (allocationPct[a] ?? 0) / 100);
  }
  // Individual stocks
  const stockCount = stockPicks.length;
  if (stockCount > 0 && (allocationPct.stocks ?? 0) > 0) {
    const stockPct = allocationPct.stocks / 100 / stockCount;
    r.stocks = {};
    for (const id of stockPicks) {
      const stock = SIMULATION_STOCKS.find(s => s.id === id);
      const prev = (byAsset.stocks ?? {})[id] ?? 0;
      const bankrupt = stock.bankruptYear && year + 1 >= stock.bankruptYear;
      if (bankrupt || prev === 0) {
        r.stocks[id] = 0;
      } else {
        const ret = stock.returns[year] ?? 0;
        r.stocks[id] = prev * (1 + ret) + monthlyContrib * 12 * stockPct;
      }
    }
  } else {
    r.stocks = {};
  }
  return r;
}

function totalPortfolio(byAsset) {
  let t = 0;
  for (const [k, v] of Object.entries(byAsset)) {
    if (k === 'stocks') { for (const sv of Object.values(v)) t += sv; }
    else t += (v ?? 0);
  }
  return t;
}

function computeVtsaxBenchmark(prev, monthlyContrib, year) {
  return prev * (1 + RETURNS.vtsax[year]) + monthlyContrib * 12;
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen({ initialSurplus, onStart }) {
  const [monthly, setMonthly] = useState(initialSurplus ?? 300);
  const [alloc, setAlloc] = useState({ vtsax: 0, advisor: 0, stocks: 0, bonds: 0, gold: 0, cash: 0 });
  const [stockPicks, setStockPicks] = useState([]);
  const [showStockPicker, setShowStockPicker] = useState(false);

  const total = Object.values(alloc).reduce((s, v) => s + v, 0);
  const remaining = 100 - total;
  const needsStocks = alloc.stocks > 0;
  const stocksReady = !needsStocks || (stockPicks.length >= MIN_PICKS && stockPicks.length <= MAX_PICKS);
  const canStart = total === 100 && stocksReady && monthly >= 50;

  function setAsset(asset, val) {
    const clamped = Math.max(0, Math.min(100, val));
    setAlloc(prev => ({ ...prev, [asset]: clamped }));
  }

  function toggleStock(id) {
    setStockPicks(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_PICKS ? [...prev, id] : prev
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Market Simulator</p>
        <h2 className="text-2xl font-bold text-slate-900">20 years. Real markets. Real decisions.</h2>
        <p className="text-slate-500 text-sm mt-1">
          Set your monthly investment and allocate across 6 asset types. Then watch 20 years of real market history unfold — crashes included.
        </p>
      </div>

      {/* Monthly amount */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-800">Monthly investment</label>
          <span className="font-bold text-indigo-700">{fmtFull(monthly)}/mo</span>
        </div>
        <input type="range" min={50} max={2000} step={25} value={monthly}
          onChange={e => setMonthly(Number(e.target.value))}
          className="w-full accent-indigo-600" />
        <div className="flex justify-between text-xs text-slate-400">
          <span>$50/mo</span><span>$2,000/mo</span>
        </div>
        {initialSurplus > 0 && (
          <p className="text-xs text-emerald-600">Suggested from your budget: {fmtFull(initialSurplus)}/mo</p>
        )}
      </div>

      {/* Allocation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-slate-800">Asset allocation</p>
          <span className={`text-sm font-bold ${remaining === 0 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {remaining === 0 ? '✓ 100% allocated' : remaining > 0 ? `${remaining}% remaining` : `${-remaining}% over`}
          </span>
        </div>
        <p className="text-xs text-slate-500">Set to 0% to exclude. Must total exactly 100%.</p>

        {Object.entries(ASSET_LABELS).map(([id, label]) => (
          <div key={id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ASSET_COLORS[id] }} />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={100} value={alloc[id]}
                  onChange={e => setAsset(id, Number(e.target.value))}
                  className="w-16 text-right text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400"
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <input type="range" min={0} max={100} step={5} value={alloc[id]}
              onChange={e => setAsset(id, Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5"
              style={{ accentColor: ASSET_COLORS[id] }}
            />
          </div>
        ))}

        {/* Crypto excluded note */}
        <p className="text-xs text-slate-400 italic mt-2">
          Crypto not included — less than 20 years of real data makes a 20-year simulation dishonest.
        </p>
      </div>

      {/* Stock picker — only if stocks > 0 */}
      {needsStocks && (
        <div className={`border rounded-xl p-4 space-y-3 ${stocksReady ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-800">
              Pick your stocks ({MIN_PICKS}–{MAX_PICKS} of 10)
            </p>
            <span className={`text-xs font-semibold ${stocksReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stockPicks.length} selected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Companies shown by sector only. You'll find out who they really are at the end.
          </p>
          <div className="space-y-2">
            {SIMULATION_STOCKS.map(stock => {
              const selected = stockPicks.includes(stock.id);
              const disabled = !selected && stockPicks.length >= MAX_PICKS;
              return (
                <button key={stock.id}
                  onClick={() => !disabled && toggleStock(stock.id)}
                  disabled={disabled}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all text-sm ${
                    selected ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900'
                    : disabled ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {stock.sectorLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => canStart && onStart({ monthly, alloc, stockPicks })}
        disabled={!canStart}
        className={`w-full font-semibold py-4 rounded-xl text-sm transition-colors ${
          canStart
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {!canStart
          ? remaining !== 0 ? `Allocate the remaining ${remaining}% to start`
            : !stocksReady ? `Pick ${MIN_PICKS}–${MAX_PICKS} stocks to start`
            : 'Set monthly amount to start'
          : 'Start 20-year simulation →'}
      </button>
    </div>
  );
}

// ── Crash event overlay ───────────────────────────────────────────────────────

function CrashOverlay({ event, byAsset, alloc, stockPicks, onConfirm }) {
  const assets = Object.entries(ASSET_LABELS).filter(([id]) => {
    if (id === 'stocks') return stockPicks.length > 0 && (alloc.stocks ?? 0) > 0;
    return (alloc[id] ?? 0) > 0;
  });

  // Rebalance state: new dollar values per asset (starts equal to current)
  const initialValues = useMemo(() => {
    const v = {};
    for (const [id] of assets) {
      if (id === 'stocks') {
        v.stocks = Object.values(byAsset.stocks ?? {}).reduce((s, x) => s + x, 0);
      } else {
        v[id] = byAsset[id] ?? 0;
      }
    }
    return v;
  }, []);

  const [newValues, setNewValues] = useState(initialValues);
  const currentTotal = Object.values(initialValues).reduce((s, v) => s + v, 0);
  const newTotal = Object.values(newValues).reduce((s, v) => s + v, 0);
  const diff = Math.abs(newTotal - currentTotal);
  const balanced = diff < 1;

  function update(id, val) {
    const v = Math.max(0, Number(val) || 0);
    setNewValues(prev => ({ ...prev, [id]: v }));
  }

  function stayTheCourse() {
    onConfirm({ moves: [] });
  }

  function confirmRebalance() {
    if (!balanced) return;
    const moves = [];
    for (const [id] of assets) {
      const prev = initialValues[id] ?? 0;
      const next = newValues[id] ?? 0;
      if (Math.abs(next - prev) > 0.5) {
        moves.push({ asset: id, from: prev, to: next, delta: next - prev });
      }
    }
    onConfirm({ moves, newValues });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className={`rounded-xl p-4 ${event.severity === 'severe' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-sm font-bold ${event.severity === 'severe' ? 'text-red-900' : 'text-amber-900'}`}>
            ⚠️ {event.headline}
          </p>
          <p className={`text-xs mt-1 ${event.severity === 'severe' ? 'text-red-700' : 'text-amber-700'}`}>
            {event.subtext}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Your current positions</p>
          <p className="text-xs text-slate-500 mb-3">
            Change the dollar values to rebalance, or click "Stay the course" to hold everything.
            Total must stay the same ({fmtFull(Math.round(currentTotal))}).
          </p>
          <div className="space-y-2">
            {assets.map(([id, label]) => {
              const cur = initialValues[id] ?? 0;
              const change = ((newValues[id] ?? 0) - cur);
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ASSET_COLORS[id] }} />
                  <span className="text-xs text-slate-600 flex-1">{label}</span>
                  <span className="text-xs text-slate-400">{fmtFull(Math.round(cur))}</span>
                  <span className="text-slate-300 text-xs">→</span>
                  <input
                    type="number"
                    value={Math.round(newValues[id] ?? 0)}
                    onChange={e => update(id, e.target.value)}
                    className="w-28 text-right text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400"
                  />
                  {Math.abs(change) > 0.5 && (
                    <span className={`text-xs font-semibold w-14 text-right ${change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {change > 0 ? '+' : ''}{fmtFull(Math.round(change))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {!balanced && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Total is {fmtFull(Math.round(newTotal))} — must equal {fmtFull(Math.round(currentTotal))}. Difference: {fmtFull(Math.round(diff))}.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={stayTheCourse}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Stay the course
          </button>
          <button
            onClick={confirmRebalance}
            disabled={!balanced}
            className={`font-semibold py-3 rounded-xl text-sm transition-colors ${
              balanced
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Rebalance →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lifestyle event overlay ───────────────────────────────────────────────────

function LifestyleOverlay({ event, currentMonthly, onConfirm }) {
  const [newMonthly, setNewMonthly] = useState(currentMonthly);
  const [pauseMonths, setPauseMonths] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-bold text-blue-900">Life event — Year {event.year}</p>
          <p className="text-sm text-blue-700 mt-1">{event.scenario}</p>
        </div>

        {event.deductLumpSum > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-800">
              <strong>{fmtFull(event.deductLumpSum)}</strong> will be deducted from your most liquid holdings to cover this expense.
            </p>
          </div>
        )}

        {event.pauseMonths ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">{event.prompt}</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} max={24} value={pauseMonths}
                onChange={e => setPauseMonths(Math.max(0, Math.min(24, Number(e.target.value))))}
                className="w-24 text-center text-lg font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
              />
              <span className="text-sm text-slate-500">months (0 = keep investing)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">{event.prompt}</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-lg">$</span>
              <input
                type="number" min={0} max={5000} value={newMonthly}
                onChange={e => setNewMonthly(Math.max(0, Number(e.target.value)))}
                className="w-36 text-lg font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
              />
              <span className="text-slate-400 text-sm">/mo</span>
            </div>
            {newMonthly < currentMonthly && (
              <p className="text-xs text-amber-600">
                Reducing from {fmtFull(currentMonthly)}/mo — that's {fmtFull(currentMonthly - newMonthly)}/mo less compounding.
              </p>
            )}
            {newMonthly > currentMonthly && (
              <p className="text-xs text-emerald-600">
                Increasing from {fmtFull(currentMonthly)}/mo — {fmtFull(newMonthly - currentMonthly)}/mo more compounding.
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => onConfirm({ newMonthly: event.pauseMonths ? 0 : newMonthly, pauseMonths })}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Bankruptcy overlay ────────────────────────────────────────────────────────

function BankruptcyOverlay({ stock, positionValue, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-900">💀 Bankruptcy</p>
          <p className="text-sm text-red-700 mt-1">{stock.bankruptNote}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-slate-500">Your position was worth</p>
          <p className="text-2xl font-bold text-red-600">{fmtFull(Math.round(positionValue))}</p>
          <p className="text-xs text-slate-500 mt-0.5">Now worth $0.</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function SimTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow text-xs space-y-1">
      <p className="font-semibold text-slate-700">Year {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Reveal screen ─────────────────────────────────────────────────────────────

function RevealScreen({ history, finalPortfolio, monthlyContrib, alloc, stockPicks, panicMoves, initialMonthly }) {
  const finalTotal = totalPortfolio(finalPortfolio);
  const finalBenchmark = history[history.length - 1]?.vtsaxBenchmark ?? 0;
  const finalCash = history[history.length - 1]?.cashBenchmark ?? 0;

  // Inflation-adjusted value (compound deflate at average ~3.4%/yr over 20 years)
  const inflationFactor = INFLATION.reduce((acc, r) => acc * (1 + r), 1);
  const realValue = finalTotal / inflationFactor;

  // SCF 2022 percentile lookup (retirement account wealth, ages 55-64)
  function getPercentile(val) {
    if (val < 25000) return '<15th';
    if (val < 75000) return '~20th';
    if (val < 185000) return '~35th';
    if (val < 513000) return '~60th';
    if (val < 1200000) return '~80th';
    return '>90th';
  }

  const panicCost = panicMoves.reduce((sum, m) => {
    // Cost = how much more they'd have if they hadn't sold
    // Approximate: the sold amount compounded at VTSAX rate from that year to year 20
    if (m.delta >= 0) return sum; // bought, not sold
    const yearsLeft = TOTAL_YEARS - m.year;
    const compounded = Math.abs(m.delta) * RETURNS.vtsax.slice(m.year).reduce(
      (acc, r, i) => i < yearsLeft ? acc * (1 + r) : acc, 1
    );
    return sum + (compounded - Math.abs(m.delta));
  }, 0);

  const selectedStocks = SIMULATION_STOCKS.filter(s => stockPicks.includes(s.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">20 years complete</p>
        <h2 className="text-2xl font-bold text-slate-900">Here's what happened.</h2>
      </div>

      {/* Three outcome cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Your portfolio</p>
          <p className="text-2xl font-bold text-indigo-800">{fmt(finalTotal)}</p>
          <p className="text-xs text-indigo-500 mt-1">in today's dollars (nominal)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-600 mb-1">100% Index fund (VTSAX)</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(finalBenchmark)}</p>
          <p className="text-xs text-emerald-500 mt-1">same {fmtFull(initialMonthly)}/mo, no decisions</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">100% Cash/HYSA</p>
          <p className="text-2xl font-bold text-slate-600">{fmt(finalCash)}</p>
          <p className="text-xs text-slate-400 mt-1">the "safe" choice</p>
        </div>
      </div>

      {/* Full chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Your 20-year journey</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map((p, i) => ({ year: i + 1, ...p }))}>
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={50} />
              <ReTooltip content={<SimTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {MARKET_EVENTS.map(e => (
                <ReferenceLine key={e.year} x={e.year} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '⚠', position: 'top', fontSize: 10 }} />
              ))}
              <Line type="monotone" dataKey="total" name="Your portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vtsaxBenchmark" name="VTSAX benchmark" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real headlines */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">The years you lived through</p>
        <p className="text-sm text-slate-300">You just simulated investing from <strong>2004 to 2023</strong>. Here's what was happening during the crashes.</p>
        <div className="space-y-2">
          {REAL_HEADLINES.map(h => (
            <div key={h.year} className="bg-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-400">Year {h.year} — {h.calYear}</p>
              <p className="text-sm text-slate-200 mt-0.5">{h.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panic cost callout */}
      {panicMoves.length > 0 && panicCost > 1000 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-red-900">The cost of your moves during crashes</p>
          {panicMoves.filter(m => m.delta < 0).map((m, i) => (
            <p key={i} className="text-xs text-red-700">
              Year {m.year}: Moved {fmtFull(Math.round(Math.abs(m.delta)))} out of {ASSET_LABELS[m.asset]}. Estimated opportunity cost: <strong>{fmt(panicCost / panicMoves.filter(x => x.delta < 0).length)}</strong>.
            </p>
          ))}
          <p className="text-xs text-red-600 mt-1 font-semibold">
            Total estimated cost of not staying the course: ~{fmt(panicCost)}
          </p>
        </div>
      )}

      {/* Individual stock reveals */}
      {selectedStocks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">Your individual stocks — revealed</p>
          <div className="space-y-2">
            {selectedStocks.map(stock => {
              const finalVal = (finalPortfolio.stocks ?? {})[stock.id] ?? 0;
              return (
                <div key={stock.id} className="bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500">{stock.sectorShort}</p>
                      <p className="text-sm font-bold text-slate-900">{stock.realName} ({stock.ticker})</p>
                    </div>
                    <p className={`text-sm font-bold ${finalVal > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {finalVal > 0 ? fmt(finalVal) : '$0 (bankrupt)'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{stock.revealNote}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real value + percentile */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-indigo-900">In today's purchasing power</p>
        <p className="text-sm text-indigo-700">
          After ~{Math.round((inflationFactor - 1) * 100)}% cumulative inflation over 20 years, your {fmt(finalTotal)} is worth approximately{' '}
          <strong>{fmt(realValue)}</strong> in 2004 dollars — that's what it could actually buy today.
        </p>
        <p className="text-xs text-indigo-600 mt-1">
          This puts you at approximately <strong>{getPercentile(finalTotal)}</strong> percentile of American retirement savings.{' '}
          100th = most savings. 0th = least. Source: Federal Reserve Survey of Consumer Finances 2022.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarketSimulator({ initialSurplus = 300 }) {
  const [phase, setPhase] = useState('SETUP');
  const [config, setConfig] = useState(null); // { monthly, alloc, stockPicks }
  const [currentYear, setCurrentYear] = useState(0); // 0 = not started; 1-20 = years complete
  const [byAsset, setByAsset] = useState({});
  const [monthlyContrib, setMonthlyContrib] = useState(300);
  const [vtsaxBenchmark, setVtsaxBenchmark] = useState(0);
  const [cashBenchmark, setCashBenchmark] = useState(0);
  const [history, setHistory] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [panicMoves, setPanicMoves] = useState([]);
  const [pendingBankruptcy, setPendingBankruptcy] = useState(null);

  const intervalRef = useRef(null);

  // Check if any stocks go bankrupt this year
  function checkBankruptcies(assets, year, stockPicks) {
    for (const id of stockPicks) {
      const stock = SIMULATION_STOCKS.find(s => s.id === id);
      if (stock?.bankruptYear === year) {
        const val = (assets.stocks ?? {})[id] ?? 0;
        if (val > 0) return { stock, positionValue: val };
      }
    }
    return null;
  }

  function advanceOneYear() {
    if (!config) return;
    const { alloc, stockPicks } = config;

    setCurrentYear(prevYear => {
      const y = prevYear; // 0-indexed array position
      if (y >= TOTAL_YEARS) return prevYear;

      // Compute new portfolio
      setByAsset(prev => {
        const newAssets = computePortfolioAfterYear(prev, alloc, monthlyContrib, y, stockPicks);

        // VTSAX benchmark (parallel, always 100% VTSAX)
        setVtsaxBenchmark(prevBench => computeVtsaxBenchmark(prevBench, config.monthly, y));

        // Cash benchmark (always 100% cash)
        setCashBenchmark(prevCash => prevCash * (1 + RETURNS.cash[y]) + config.monthly * 12);

        const total = totalPortfolio(newAssets);

        setHistory(h => [...h, {
          total,
          vtsaxBenchmark: undefined, // set via separate state update (approximation)
          cashBenchmark: undefined,
        }]);

        // Check events
        const nextYearNum = y + 1; // 1-indexed
        const marketEvent = MARKET_EVENTS.find(e => e.year === nextYearNum);
        const lifestyleEvent = LIFESTYLE_EVENTS.find(e => e.year === nextYearNum);
        const bankruptcy = checkBankruptcies(newAssets, nextYearNum, stockPicks);

        if (bankruptcy) {
          clearInterval(intervalRef.current);
          setPendingBankruptcy(bankruptcy);
          setPhase('PAUSED_BANKRUPTCY');
        } else if (marketEvent) {
          clearInterval(intervalRef.current);
          setActiveEvent(marketEvent);
          setPhase('PAUSED_MARKET');
        } else if (lifestyleEvent) {
          clearInterval(intervalRef.current);
          setActiveEvent(lifestyleEvent);
          setPhase('PAUSED_LIFESTYLE');
        } else if (nextYearNum >= TOTAL_YEARS) {
          clearInterval(intervalRef.current);
          setPhase('REVEAL');
        }

        return newAssets;
      });

      return prevYear + 1;
    });
  }

  // Start/resume interval when RUNNING
  useEffect(() => {
    if (phase !== 'RUNNING') {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advanceOneYear, 2000);
    return () => clearInterval(intervalRef.current);
  }, [phase, monthlyContrib, config]);

  function handleStart({ monthly, alloc, stockPicks }) {
    // Initialize portfolio with 0 values
    const initial = { vtsax: 0, advisor: 0, bonds: 0, gold: 0, cash: 0, stocks: {} };
    for (const id of stockPicks) initial.stocks[id] = 0;
    setByAsset(initial);
    setMonthlyContrib(monthly);
    setConfig({ monthly, alloc, stockPicks });
    setCurrentYear(0);
    setHistory([{ total: 0, vtsaxBenchmark: 0, cashBenchmark: 0 }]);
    setVtsaxBenchmark(0);
    setCashBenchmark(0);
    setPhase('RUNNING');
  }

  function handleCrashConfirm({ moves, newValues }) {
    if (moves?.length > 0 && newValues) {
      // Apply rebalance
      setByAsset(prev => {
        const updated = { ...prev };
        for (const [id, val] of Object.entries(newValues)) {
          if (id === 'stocks') continue;
          updated[id] = val;
        }
        // Track panic moves
        setPanicMoves(pm => [
          ...pm,
          ...moves.map(m => ({ ...m, year: currentYear })),
        ]);
        return updated;
      });
    }
    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleLifestyleConfirm({ newMonthly, pauseMonths }) {
    if (activeEvent?.deductLumpSum > 0) {
      // Deduct from most liquid: cash > bonds > vtsax
      setByAsset(prev => {
        let remaining = activeEvent.deductLumpSum;
        const updated = { ...prev };
        for (const a of ['cash', 'bonds', 'vtsax']) {
          const avail = updated[a] ?? 0;
          const take = Math.min(avail, remaining);
          updated[a] = avail - take;
          remaining -= take;
          if (remaining <= 0) break;
        }
        return updated;
      });
    }
    if (pauseMonths > 0) {
      setMonthlyContrib(0);
      // Resume contributions after pause: handled by next lifestyle event or manually
      setTimeout(() => setMonthlyContrib(newMonthly || config.monthly), pauseMonths * 2000);
    } else {
      setMonthlyContrib(newMonthly);
    }
    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleBankruptcyConfirm() {
    // Zero out the bankrupt stock position
    setByAsset(prev => ({
      ...prev,
      stocks: { ...(prev.stocks ?? {}), [pendingBankruptcy.stock.id]: 0 },
    }));
    setPendingBankruptcy(null);

    // Check if there's also a market event this year
    const marketEvent = MARKET_EVENTS.find(e => e.year === currentYear);
    if (marketEvent) {
      setActiveEvent(marketEvent);
      setPhase('PAUSED_MARKET');
    } else {
      setPhase('RUNNING');
    }
  }

  // Sync history with latest benchmark values
  const chartHistory = useMemo(() => history.map((p, i) => ({
    ...p,
    year: i + 1,
    vtsaxBenchmark: i === history.length - 1 ? vtsaxBenchmark : p.vtsaxBenchmark ?? 0,
    cashBenchmark: i === history.length - 1 ? cashBenchmark : p.cashBenchmark ?? 0,
  })), [history, vtsaxBenchmark, cashBenchmark]);

  if (phase === 'SETUP') {
    return <SetupScreen initialSurplus={initialSurplus} onStart={handleStart} />;
  }

  if (phase === 'REVEAL') {
    return (
      <RevealScreen
        history={chartHistory}
        finalPortfolio={byAsset}
        monthlyContrib={monthlyContrib}
        alloc={config?.alloc ?? {}}
        stockPicks={config?.stockPicks ?? []}
        panicMoves={panicMoves}
        initialMonthly={config?.monthly ?? 300}
      />
    );
  }

  // RUNNING / PAUSED states — show the animated chart
  const currentTotal = totalPortfolio(byAsset);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Overlays */}
      {phase === 'PAUSED_MARKET' && activeEvent && (
        <CrashOverlay
          event={activeEvent}
          byAsset={byAsset}
          alloc={config?.alloc ?? {}}
          stockPicks={config?.stockPicks ?? []}
          onConfirm={handleCrashConfirm}
        />
      )}
      {phase === 'PAUSED_LIFESTYLE' && activeEvent && (
        <LifestyleOverlay
          event={activeEvent}
          currentMonthly={monthlyContrib}
          onConfirm={handleLifestyleConfirm}
        />
      )}
      {phase === 'PAUSED_BANKRUPTCY' && pendingBankruptcy && (
        <BankruptcyOverlay
          stock={pendingBankruptcy.stock}
          positionValue={pendingBankruptcy.positionValue}
          onConfirm={handleBankruptcyConfirm}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Market Simulator</p>
          <h2 className="text-xl font-bold text-slate-900">
            Year {currentYear} of {TOTAL_YEARS}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Portfolio value</p>
          <p className="text-2xl font-bold text-indigo-700">{fmt(currentTotal)}</p>
        </div>
      </div>

      {/* Year progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(currentYear / TOTAL_YEARS) * 100}%` }}
        />
      </div>

      {/* Live chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-slate-700">Portfolio vs. VTSAX benchmark</p>
          <p className={`text-xs font-semibold ${currentTotal >= vtsaxBenchmark ? 'text-emerald-600' : 'text-red-500'}`}>
            {currentTotal >= vtsaxBenchmark
              ? `+${fmt(currentTotal - vtsaxBenchmark)} ahead`
              : `${fmt(currentTotal - vtsaxBenchmark)} behind`}
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartHistory}>
              <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={50} />
              <ReTooltip content={<SimTooltip />} />
              {MARKET_EVENTS.filter(e => e.year <= currentYear).map(e => (
                <ReferenceLine key={e.year} x={e.year} stroke="#ef4444" strokeDasharray="3 3" />
              ))}
              <Line type="monotone" dataKey="total" name="Your portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={800} />
              <Line type="monotone" dataKey="vtsaxBenchmark" name="VTSAX (100%)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Position breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current positions</p>
        <div className="space-y-2">
          {Object.entries(ASSET_LABELS).map(([id, label]) => {
            const val = id === 'stocks'
              ? Object.values(byAsset.stocks ?? {}).reduce((s, v) => s + v, 0)
              : (byAsset[id] ?? 0);
            if (val < 1 && (config?.alloc?.[id] ?? 0) === 0) return null;
            const pctOfPortfolio = currentTotal > 0 ? Math.round((val / currentTotal) * 100) : 0;
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ASSET_COLORS[id] }} />
                <span className="text-sm text-slate-600 flex-1">{label}</span>
                <div className="w-24 bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${pctOfPortfolio}%`, backgroundColor: ASSET_COLORS[id] }} />
                </div>
                <span className="text-sm font-semibold text-slate-800 w-20 text-right">{fmt(val)}</span>
                <span className="text-xs text-slate-400 w-8 text-right">{pctOfPortfolio}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {phase === 'RUNNING' && (
        <p className="text-xs text-slate-400 text-center">Advancing 1 year every 2 seconds — crashes will interrupt automatically.</p>
      )}
    </div>
  );
}
