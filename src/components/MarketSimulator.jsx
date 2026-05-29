import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  TOTAL_YEARS, RETURNS, INFLATION, MARKET_EVENTS, LIFESTYLE_EVENTS,
  REAL_HEADLINES, YEAR_CONTEXT,
} from '../data/marketHistory';
import {
  SIMULATION_STOCKS, MIN_PICKS, MAX_PICKS,
} from '../data/simulationStocks';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const ASSET_LABELS = {
  vtsax:   'Index fund',
  advisor: 'Financial advisor',
  stocks:  'Individual stocks',
  bonds:   'Bond index',
  gold:    'Gold',
  cash:    'Cash / HYSA',
};

const ASSET_DESCRIPTORS = {
  vtsax:   'Owns ~4,000 US companies. ~10%/yr nominal historically. Volatile.',
  advisor: 'Professionally managed — at ~1.5%/yr in fees subtracted from returns.',
  stocks:  'You pick 4–5 companies. Outcomes vary wildly. Companies can go bankrupt.',
  bonds:   'Government & corporate debt. ~4–5%/yr, lower volatility than stocks.',
  gold:    'Price appreciation only — no dividends. Volatile. No income.',
  cash:    'High-yield savings. Safe, but inflation slowly erodes purchasing power.',
};

const ASSET_COLORS = {
  vtsax: '#6366f1', advisor: '#8b5cf6', stocks: '#f59e0b',
  bonds: '#10b981', gold:    '#eab308', cash:   '#94a3b8',
};

function getAdvisorReturn(y) {
  return Math.max(-0.999, RETURNS.vtsax[y] - 0.015);
}

// Fix Bug 1 (prev===0 blocked first-year investment) and Bug 4 (contributions lost to bankrupt stocks)
function computePortfolioAfterYear(byAsset, allocationPct, monthlyContrib, year, stockPicks) {
  const r = {};
  for (const a of ['vtsax', 'advisor', 'bonds', 'gold', 'cash']) {
    const ret = a === 'advisor' ? getAdvisorReturn(year) : RETURNS[a][year];
    r[a] = (byAsset[a] ?? 0) * (1 + ret) + monthlyContrib * 12 * (allocationPct[a] ?? 0) / 100;
  }

  if (stockPicks.length > 0 && (allocationPct.stocks ?? 0) > 0) {
    // Bug 4 fix: only distribute contributions to ALIVE stocks
    const aliveIds = stockPicks.filter(id => {
      const s = SIMULATION_STOCKS.find(x => x.id === id);
      return !(s?.bankruptYear && year + 1 >= s.bankruptYear);
    });
    const contribPerAlive = aliveIds.length > 0
      ? (monthlyContrib * 12 * (allocationPct.stocks / 100) / aliveIds.length)
      : 0;

    r.stocks = {};
    for (const id of stockPicks) {
      const stock = SIMULATION_STOCKS.find(s => s.id === id);
      const bankrupt = stock?.bankruptYear && year + 1 >= stock.bankruptYear;
      if (bankrupt) {
        r.stocks[id] = 0; // Bug 1 fix: removed `|| prev === 0`
      } else {
        const prev = (byAsset.stocks ?? {})[id] ?? 0;
        const ret  = stock.returns[year] ?? 0;
        r.stocks[id] = prev * (1 + ret) + contribPerAlive;
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

// Returns array of all stocks going bankrupt this year (using prev values for non-zero check)
function checkBankruptcies(prevAssets, year, stockPicks) {
  return stockPicks.flatMap(id => {
    const stock = SIMULATION_STOCKS.find(s => s.id === id);
    if (stock?.bankruptYear !== year) return [];
    const val = (prevAssets.stocks ?? {})[id] ?? 0;
    return val > 0 ? [{ stock, positionValue: val }] : [];
  });
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen({ initialSurplus, onStart }) {
  const [monthly, setMonthly] = useState(initialSurplus ?? 300);
  const [alloc, setAlloc] = useState({ vtsax: 0, advisor: 0, stocks: 0, bonds: 0, gold: 0, cash: 0 });
  const [stockPicks, setStockPicks] = useState([]);

  const total     = Object.values(alloc).reduce((s, v) => s + v, 0);
  const remaining = 100 - total;
  const needsStocks  = alloc.stocks > 0;
  const stocksReady  = !needsStocks || (stockPicks.length >= MIN_PICKS && stockPicks.length <= MAX_PICKS);
  const canStart     = total === 100 && stocksReady && monthly >= 50;

  function setAsset(asset, val) {
    setAlloc(prev => ({ ...prev, [asset]: Math.max(0, Math.min(100, val)) }));
  }

  function toggleStock(id) {
    setStockPicks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
        : prev.length < MAX_PICKS ? [...prev, id] : prev
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Market Simulator</p>
        <h2 className="text-2xl font-bold text-slate-900">20 years. Real markets. Real decisions.</h2>
        <p className="text-slate-500 text-sm mt-1">
          Set your monthly investment and allocate across 6 asset types. Then watch 20 years of real market history — crashes included.
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
        <p className="text-xs text-slate-500">Must total exactly 100%. Set to 0% to exclude an asset.</p>

        {Object.entries(ASSET_LABELS).map(([id, label]) => (
          <div key={id}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-start gap-2 flex-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: ASSET_COLORS[id] }} />
                <div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{ASSET_DESCRIPTORS[id]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
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
              className="w-full h-1.5"
              style={{ accentColor: ASSET_COLORS[id] }}
            />
          </div>
        ))}

        <p className="text-xs text-slate-400 italic mt-2">
          Crypto not included — less than 20 years of real data makes a 20-year simulation dishonest.
        </p>
      </div>

      {/* Stock picker */}
      {needsStocks && (
        <div className={`border rounded-xl p-4 space-y-3 ${stocksReady ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-800">Pick your stocks ({MIN_PICKS}–{MAX_PICKS} of 10)</p>
            <span className={`text-xs font-semibold ${stocksReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stockPicks.length} selected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Companies shown by sector only. You'll find out who they really are at the end.
          </p>
          <div className="space-y-2">
            {SIMULATION_STOCKS.map(stock => {
              const selected  = stockPicks.includes(stock.id);
              const disabled  = !selected && stockPicks.length >= MAX_PICKS;
              return (
                <button key={stock.id}
                  onClick={() => !disabled && toggleStock(stock.id)}
                  disabled={disabled}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all text-sm ${
                    selected  ? 'bg-indigo-50 border-indigo-400 font-semibold text-indigo-900'
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
          canStart ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                   : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {!canStart
          ? remaining !== 0 ? `Allocate the remaining ${remaining}% to start`
            : !stocksReady  ? `Pick ${MIN_PICKS}–${MAX_PICKS} stocks to start`
            : 'Set monthly amount to start'
          : 'Start 20-year simulation →'}
      </button>
    </div>
  );
}

// ── Crash overlay (UX 3: % exit sliders → cash, no dollar-arithmetic) ────────

function CrashOverlay({ event, byAsset, alloc, stockPicks, onConfirm }) {
  const sellableAssets = Object.entries(ASSET_LABELS).filter(([id]) => {
    if (id === 'cash') return false; // can't sell cash to cash
    if (id === 'stocks') return stockPicks.length > 0 && (alloc.stocks ?? 0) > 0;
    return (alloc[id] ?? 0) > 0;
  });

  const currentValues = {};
  for (const [id] of sellableAssets) {
    currentValues[id] = id === 'stocks'
      ? Object.values(byAsset.stocks ?? {}).reduce((s, x) => s + x, 0)
      : (byAsset[id] ?? 0);
  }
  const cashValue = byAsset.cash ?? 0;

  const [exitPct, setExitPct] = useState({});

  const totalExit = sellableAssets.reduce((s, [id]) => {
    return s + (currentValues[id] ?? 0) * ((exitPct[id] ?? 0) / 100);
  }, 0);

  function stayTheCourse() {
    onConfirm({ moves: [] });
  }

  function confirmMoves() {
    const moves = [];
    const newByAsset = {
      ...byAsset,
      stocks: { ...(byAsset.stocks ?? {}) },
    };
    let cashGain = 0;

    for (const [id] of sellableAssets) {
      const pct = exitPct[id] ?? 0;
      if (pct === 0) continue;
      const curVal    = currentValues[id];
      const sellAmt   = curVal * (pct / 100);
      cashGain       += sellAmt;
      moves.push({ asset: id, delta: -sellAmt });

      if (id === 'stocks') {
        const scale = 1 - pct / 100;
        for (const sid of Object.keys(newByAsset.stocks)) {
          newByAsset.stocks[sid] = (newByAsset.stocks[sid] ?? 0) * scale;
        }
      } else {
        newByAsset[id] = curVal - sellAmt;
      }
    }
    newByAsset.cash = cashValue + cashGain;
    onConfirm({ moves, newByAsset });
  }

  const hasMoves = totalExit > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className={`rounded-xl p-4 ${event.severity === 'severe' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-sm font-bold ${event.severity === 'severe' ? 'text-red-900' : 'text-amber-900'}`}>
            ⚠️ {event.headline}
          </p>
          <p className={`text-xs mt-1 ${event.severity === 'severe' ? 'text-red-700' : 'text-amber-700'}`}>
            {event.subtext}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1">What do you want to do?</p>
          <p className="text-xs text-slate-500 mb-3">
            Drag any slider to sell that percentage of an asset and move it to cash. Leave all at 0% to hold everything.
          </p>

          {sellableAssets.map(([id, label]) => {
            const val     = currentValues[id] ?? 0;
            const pct     = exitPct[id] ?? 0;
            const sellAmt = val * (pct / 100);
            return (
              <div key={id} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[id] }} />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span className="text-xs text-slate-400">{fmtFull(Math.round(val))}</span>
                  </div>
                  {pct > 0 && (
                    <span className="text-xs font-semibold text-red-600">
                      Sell {pct}% = {fmtFull(Math.round(sellAmt))} → cash
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4">0</span>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={pct}
                    onChange={e => setExitPct(prev => ({ ...prev, [id]: Number(e.target.value) }))}
                    className="flex-1"
                    style={{ accentColor: pct > 0 ? '#ef4444' : '#94a3b8' }}
                  />
                  <span className="text-xs text-slate-400 w-8">100%</span>
                </div>
              </div>
            );
          })}
        </div>

        {hasMoves && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <p className="text-xs text-amber-800">
              Moving <strong>{fmtFull(Math.round(totalExit))}</strong> to cash.
              New cash position: <strong>{fmtFull(Math.round(cashValue + totalExit))}</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={stayTheCourse}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Hold everything
          </button>
          <button
            onClick={confirmMoves}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {hasMoves ? 'Confirm moves →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lifestyle overlay (Error 1: removed pauseMonths mechanic) ─────────────────

function LifestyleOverlay({ event, currentMonthly, onConfirm }) {
  const [newMonthly, setNewMonthly] = useState(currentMonthly);

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
              <strong>{fmtFull(event.deductLumpSum)}</strong> will be deducted from your most liquid holdings.
            </p>
          </div>
        )}

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
              Reducing from {fmtFull(currentMonthly)}/mo — {fmtFull(currentMonthly - newMonthly)}/mo less compounding each month.
            </p>
          )}
          {newMonthly > currentMonthly && (
            <p className="text-xs text-emerald-600">
              Increasing from {fmtFull(currentMonthly)}/mo — {fmtFull(newMonthly - currentMonthly)}/mo more compounding.
            </p>
          )}
        </div>

        <button
          onClick={() => onConfirm({ newMonthly })}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Bankruptcy overlay (now handles multiple simultaneous bankruptcies) ────────

function BankruptcyOverlay({ bankruptcies, onConfirm }) {
  const totalLost = bankruptcies.reduce((s, b) => s + b.positionValue, 0);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-900">💀 {bankruptcies.length > 1 ? `${bankruptcies.length} companies went bankrupt` : 'Bankruptcy'}</p>
        </div>
        <div className="space-y-2">
          {bankruptcies.map(({ stock, positionValue }) => (
            <div key={stock.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-sm text-slate-700">{stock.bankruptNote}</p>
              <p className="text-xs text-slate-500 mt-1">
                Your position: <span className="font-semibold text-red-600">{fmtFull(Math.round(positionValue))} → $0</span>
              </p>
            </div>
          ))}
        </div>
        {bankruptcies.length > 1 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <p className="text-xs text-red-800">Total lost to bankruptcy: <strong>{fmtFull(Math.round(totalLost))}</strong></p>
          </div>
        )}
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
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

// ── Reveal screen (Error 2-3: per-move panic cost; UX 5: restart button) ──────

function RevealScreen({ history, finalPortfolio, alloc, stockPicks, panicMoves, initialMonthly, onReset }) {
  const lastPoint    = history[history.length - 1] ?? {};
  const finalTotal   = totalPortfolio(finalPortfolio);
  const finalVtsax   = lastPoint.vtsaxBenchmark ?? 0;
  const finalCash    = lastPoint.cashBenchmark  ?? 0;

  const inflationFactor = INFLATION.reduce((acc, r) => acc * (1 + r), 1);
  const realValue = finalTotal / inflationFactor;

  function getPercentile(val) {
    if (val < 25000)   return '<15th';
    if (val < 75000)   return '~20th';
    if (val < 185000)  return '~35th';
    if (val < 513000)  return '~60th';
    if (val < 1200000) return '~80th';
    return '>90th';
  }

  // Error 2-3 fix: per-move panic cost with correct year indexing
  const panicDetails = panicMoves
    .filter(m => m.delta < 0)
    .map(m => {
      const sold = Math.abs(m.delta);
      let compounded = sold;
      // m.year is 1-indexed; compounding starts from that index (= year after event)
      for (let i = m.year; i < TOTAL_YEARS; i++) compounded *= (1 + RETURNS.vtsax[i]);
      return { ...m, sold, opportunityCost: compounded - sold };
    });
  const totalPanicCost = panicDetails.reduce((s, d) => s + d.opportunityCost, 0);

  const selectedStocks = SIMULATION_STOCKS.filter(s => stockPicks.includes(s.id));

  const chartData = history.map((p, i) => ({ year: i, ...p }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">20 years complete</p>
          <h2 className="text-2xl font-bold text-slate-900">Here's what happened.</h2>
        </div>
        <button
          onClick={onReset}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-colors"
        >
          Try a different strategy →
        </button>
      </div>

      {/* Three outcome cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Your portfolio</p>
          <p className="text-2xl font-bold text-indigo-800">{fmt(finalTotal)}</p>
          <p className="text-xs text-indigo-500 mt-1">nominal (today's dollars)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-600 mb-1">100% Index fund (VTSAX)</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(finalVtsax)}</p>
          <p className="text-xs text-emerald-500 mt-1">same {fmtFull(initialMonthly)}/mo, no decisions</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">100% Cash / HYSA</p>
          <p className="text-2xl font-bold text-slate-600">{fmt(finalCash)}</p>
          <p className="text-xs text-slate-400 mt-1">the "safe" choice</p>
        </div>
      </div>

      {/* Full chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Your 20-year journey</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={55} />
              <ReTooltip content={<SimTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {MARKET_EVENTS.map(e => (
                <ReferenceLine key={e.year} x={e.year} stroke="#ef4444" strokeDasharray="3 3"
                  label={{ value: '⚠', position: 'top', fontSize: 10 }} />
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
        <p className="text-sm text-slate-300">You simulated investing from <strong>2004 to 2023</strong>.</p>
        <div className="space-y-2">
          {REAL_HEADLINES.map(h => (
            <div key={h.year} className="bg-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-400">Year {h.year} — {h.calYear}</p>
              <p className="text-sm text-slate-200 mt-0.5">{h.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panic cost — per move */}
      {panicDetails.length > 0 && totalPanicCost > 500 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-900">The cost of selling during crashes</p>
          {panicDetails.map((d, i) => (
            <div key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
              Year {d.year}: Moved {fmtFull(Math.round(d.sold))} out of {ASSET_LABELS[d.asset]}.
              If held and compounded in VTSAX: <strong>+{fmt(d.opportunityCost)}</strong> more by Year 20.
            </div>
          ))}
          <p className="text-xs font-semibold text-red-800">
            Total estimated cost of not staying the course: ~{fmt(totalPanicCost)}
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
          <strong>{fmt(realValue)}</strong> in 2004 dollars.
        </p>
        <p className="text-xs text-indigo-600 mt-1">
          This puts you at approximately <strong>{getPercentile(finalTotal)}</strong> percentile of American retirement savings.
          Source: Federal Reserve Survey of Consumer Finances 2022.
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-sm transition-colors"
      >
        Try a different strategy →
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarketSimulator({ initialSurplus = 300 }) {
  const [phase, setPhase] = useState('SETUP');
  const [config, setConfig] = useState(null);
  const [currentYear, setCurrentYear] = useState(0);
  const [byAsset, setByAsset] = useState({});
  const [monthlyContrib, setMonthlyContrib] = useState(300);
  const [history, setHistory] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [panicMoves, setPanicMoves] = useState([]);
  const [pendingBankruptcies, setPendingBankruptcies] = useState([]);

  // Bug 2 fix: benchmarks stored as refs, values pushed into history directly
  const vtsaxBenchRef = useRef(0);
  const cashBenchRef  = useRef(0);

  // UX 1: speed control + pause/play
  const [simSpeed, setSimSpeed]   = useState(3000); // ms per year
  const [simPaused, setSimPaused] = useState(false);

  const intervalRef = useRef(null);

  function advanceOneYear() {
    if (!config) return;
    const { alloc, stockPicks } = config;

    setCurrentYear(prevYear => {
      const y = prevYear;
      if (y >= TOTAL_YEARS) return prevYear;

      setByAsset(prev => {
        const newAssets = computePortfolioAfterYear(prev, alloc, monthlyContrib, y, stockPicks);
        const total     = totalPortfolio(newAssets);

        // Bug 2 + 3 fix: benchmarks computed from refs using current monthlyContrib, stored in history
        const newVtsax = vtsaxBenchRef.current * (1 + RETURNS.vtsax[y]) + monthlyContrib * 12;
        const newCash  = cashBenchRef.current  * (1 + RETURNS.cash[y])  + monthlyContrib * 12;
        vtsaxBenchRef.current = newVtsax;
        cashBenchRef.current  = newCash;

        setHistory(h => [...h, { total, vtsaxBenchmark: newVtsax, cashBenchmark: newCash }]);

        const nextYear = y + 1; // 1-indexed

        // Bug: check bankruptcies against PREV state (positions before zeroing)
        const bkr = checkBankruptcies(prev, nextYear, stockPicks);
        const mkt = MARKET_EVENTS.find(e => e.year === nextYear);
        const lfe = LIFESTYLE_EVENTS.find(e => e.year === nextYear);

        if (bkr.length > 0) {
          clearInterval(intervalRef.current);
          setPendingBankruptcies(bkr);
          setPhase('PAUSED_BANKRUPTCY');
        } else if (mkt) {
          clearInterval(intervalRef.current);
          setActiveEvent(mkt);
          setPhase('PAUSED_MARKET');
        } else if (lfe) {
          clearInterval(intervalRef.current);
          setActiveEvent(lfe);
          setPhase('PAUSED_LIFESTYLE');
        } else if (nextYear >= TOTAL_YEARS) {
          clearInterval(intervalRef.current);
          setPhase('REVEAL');
        }

        return newAssets;
      });

      return prevYear + 1;
    });
  }

  useEffect(() => {
    if (phase !== 'RUNNING' || simPaused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advanceOneYear, simSpeed);
    return () => clearInterval(intervalRef.current);
  }, [phase, monthlyContrib, config, simSpeed, simPaused]);

  function handleStart({ monthly, alloc, stockPicks }) {
    const initial = { vtsax: 0, advisor: 0, bonds: 0, gold: 0, cash: 0, stocks: {} };
    for (const id of stockPicks) initial.stocks[id] = 0;
    vtsaxBenchRef.current = 0;
    cashBenchRef.current  = 0;
    setByAsset(initial);
    setMonthlyContrib(monthly);
    setConfig({ monthly, alloc, stockPicks });
    setCurrentYear(0);
    setHistory([{ total: 0, vtsaxBenchmark: 0, cashBenchmark: 0 }]);
    setPanicMoves([]);
    setSimPaused(false);
    setPhase('RUNNING');
  }

  function handleReset() {
    vtsaxBenchRef.current = 0;
    cashBenchRef.current  = 0;
    setPhase('SETUP');
    setConfig(null);
    setCurrentYear(0);
    setByAsset({});
    setMonthlyContrib(300);
    setHistory([]);
    setPanicMoves([]);
    setActiveEvent(null);
    setPendingBankruptcies([]);
    setSimPaused(false);
  }

  function handleCrashConfirm({ moves, newByAsset }) {
    if (moves?.length > 0 && newByAsset) {
      setByAsset(() => newByAsset);
      setPanicMoves(pm => [...pm, ...moves.map(m => ({ ...m, year: currentYear }))]);
    }
    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleLifestyleConfirm({ newMonthly }) {
    if (activeEvent?.deductLumpSum > 0) {
      setByAsset(prev => {
        let remaining = activeEvent.deductLumpSum;
        const updated = { ...prev };
        for (const a of ['cash', 'bonds', 'vtsax']) {
          const avail = updated[a] ?? 0;
          const take  = Math.min(avail, remaining);
          updated[a]  = avail - take;
          remaining  -= take;
          if (remaining <= 0) break;
        }
        return updated;
      });
    }
    setMonthlyContrib(newMonthly);
    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleBankruptcyConfirm() {
    // Positions are already zeroed by computePortfolioAfterYear — just check for coincident market event
    setPendingBankruptcies([]);
    const marketEvent = MARKET_EVENTS.find(e => e.year === currentYear);
    if (marketEvent) {
      setActiveEvent(marketEvent);
      setPhase('PAUSED_MARKET');
    } else {
      setPhase('RUNNING');
    }
  }

  if (phase === 'SETUP') {
    return <SetupScreen initialSurplus={initialSurplus} onStart={handleStart} />;
  }

  if (phase === 'REVEAL') {
    return (
      <RevealScreen
        history={history}
        finalPortfolio={byAsset}
        alloc={config?.alloc ?? {}}
        stockPicks={config?.stockPicks ?? []}
        panicMoves={panicMoves}
        initialMonthly={config?.monthly ?? 300}
        onReset={handleReset}
      />
    );
  }

  const currentTotal  = totalPortfolio(byAsset);
  const vtsaxCurrent  = vtsaxBenchRef.current;
  const yearContext   = YEAR_CONTEXT[currentYear] ?? null;

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
      {phase === 'PAUSED_BANKRUPTCY' && pendingBankruptcies.length > 0 && (
        <BankruptcyOverlay
          bankruptcies={pendingBankruptcies}
          onConfirm={handleBankruptcyConfirm}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Market Simulator</p>
          <h2 className="text-xl font-bold text-slate-900">Year {currentYear} of {TOTAL_YEARS}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Portfolio value</p>
          <p className="text-2xl font-bold text-indigo-700">{fmt(currentTotal)}</p>
          {vtsaxCurrent > 0 && (
            <p className={`text-xs font-semibold mt-0.5 ${currentTotal >= vtsaxCurrent ? 'text-emerald-600' : 'text-red-500'}`}>
              {currentTotal >= vtsaxCurrent
                ? `+${fmt(currentTotal - vtsaxCurrent)} vs. VTSAX`
                : `${fmt(currentTotal - vtsaxCurrent)} vs. VTSAX`}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
          style={{ width: `${(currentYear / TOTAL_YEARS) * 100}%` }}
        />
      </div>

      {/* UX 1: Speed controls + pause/play */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSimPaused(p => !p)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            simPaused ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {simPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <span className="text-xs text-slate-400">Speed:</span>
        {[{ label: '1×', ms: 3000 }, { label: '2×', ms: 1500 }, { label: '5×', ms: 500 }].map(({ label, ms }) => (
          <button key={ms}
            onClick={() => setSimSpeed(ms)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              simSpeed === ms ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto">{fmtFull(monthlyContrib)}/mo investing</span>
      </div>

      {/* UX 2: Year context */}
      {yearContext && phase === 'RUNNING' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Year {currentYear}:</span> {yearContext}
          </p>
        </div>
      )}

      {/* Live chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Portfolio vs. VTSAX benchmark</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map((p, i) => ({ year: i, ...p }))}>
              <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={55} />
              <ReTooltip content={<SimTooltip />} />
              {MARKET_EVENTS.filter(e => e.year <= currentYear).map(e => (
                <ReferenceLine key={e.year} x={e.year} stroke="#ef4444" strokeDasharray="3 3" />
              ))}
              <Line type="monotone" dataKey="total" name="Your portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={600} />
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
    </div>
  );
}
