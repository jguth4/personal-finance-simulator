import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  TOTAL_YEARS, RETURNS, INFLATION, MARKET_EVENTS, LIFESTYLE_EVENTS,
  REAL_HEADLINES, YEAR_CONTEXT,
  MONTHLY_INCOME, MONTHLY_BASE_EXPENSES_DEFAULT, MAX_MONTHLY_INVESTABLE,
} from '../data/marketHistory';
import {
  SIMULATION_STOCKS, MIN_PICKS, MAX_PICKS,
} from '../data/simulationStocks';

const TOTAL_MONTHS = TOTAL_YEARS * 12; // 240

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function computeChoiceImpact(choice, yearsLeft) {
  if (yearsLeft <= 0) return { cost: 0, benefit: 0 };
  const RATE = 0.07;
  const fvAnnuity = ((Math.pow(1 + RATE, yearsLeft) - 1) / RATE);
  const fvLump    = Math.pow(1 + RATE, yearsLeft);

  let cost = 0, benefit = 0;
  const cashImpact    = choice.cashImpact    ?? 0;
  const loanAmount    = choice.loanAmount    ?? 0;
  const expDelta      = choice.monthlyExpenseDelta  ?? 0;
  const contribDelta  = choice.monthlyContribDelta  ?? 0;
  const investLumpSum = choice.investLumpSum ?? 0;

  if (cashImpact < 0)    cost    += Math.abs(cashImpact) * fvLump;
  if (loanAmount > 0)    cost    += loanAmount * fvLump;
  if (expDelta > 0)      cost    += expDelta * 12 * fvAnnuity;
  if (contribDelta < 0)  cost    += Math.abs(contribDelta) * 12 * fvAnnuity;
  if (expDelta < 0)      benefit += Math.abs(expDelta) * 12 * fvAnnuity;
  if (contribDelta > 0)  benefit += contribDelta * 12 * fvAnnuity;
  if (investLumpSum > 0) benefit += investLumpSum * fvLump;

  return { cost: Math.round(cost), benefit: Math.round(benefit) };
}

const ASSET_LABELS = {
  vtsax:   'Index fund',
  advisor: 'Financial advisor',
  stocks:  'Individual stocks',
  bonds:   'Bond index',
  gold:    'Gold',
  cash:    'High-Yield Savings (HYSA)',
};

const ASSET_DESCRIPTORS = {
  vtsax:   'Owns ~4,000 US companies. ~10%/yr nominal historically. Volatile.',
  advisor: 'Professionally managed — at ~1.5%/yr in fees subtracted from returns.',
  stocks:  'You pick 4–5 companies. Outcomes vary wildly. Companies can go bankrupt.',
  bonds:   'Government & corporate debt. ~4–5%/yr, lower volatility than stocks.',
  gold:    'Price appreciation only — no dividends. Volatile. No income.',
  cash:    'High-yield savings account. Safe, but inflation slowly erodes purchasing power. This is where most Americans keep their money.',
};

const ASSET_COLORS = {
  vtsax: '#6366f1', advisor: '#8b5cf6', stocks: '#f59e0b',
  bonds: '#10b981', gold: '#eab308', cash: '#94a3b8',
};

function getAdvisorReturn(yearIdx) {
  return Math.max(-0.999, RETURNS.vtsax[yearIdx] - 0.015);
}

function computePortfolioAfterMonth(byAsset, allocationPct, mc, monthIndex, stockPicks) {
  const yearIdx = Math.floor(monthIndex / 12);
  const r = {};

  for (const a of ['vtsax', 'advisor', 'bonds', 'gold', 'cash']) {
    const annualRate  = a === 'advisor' ? getAdvisorReturn(yearIdx) : (RETURNS[a][yearIdx] ?? 0);
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    r[a] = (byAsset[a] ?? 0) * (1 + monthlyRate) + mc * (allocationPct[a] ?? 0) / 100;
  }

  if (stockPicks.length > 0 && (allocationPct.stocks ?? 0) > 0) {
    const simYear = Math.floor(monthIndex / 12) + 1; // 1-indexed
    const aliveIds = stockPicks.filter(id => {
      const s = SIMULATION_STOCKS.find(x => x.id === id);
      return !(s?.bankruptYear && simYear >= s.bankruptYear);
    });
    const contribPerAlive = aliveIds.length > 0
      ? mc * (allocationPct.stocks / 100) / aliveIds.length
      : 0;

    r.stocks = {};
    for (const id of stockPicks) {
      const stock    = SIMULATION_STOCKS.find(s => s.id === id);
      const bankrupt = stock?.bankruptYear && simYear >= stock.bankruptYear;
      if (bankrupt) {
        r.stocks[id] = 0;
      } else {
        const prev       = (byAsset.stocks ?? {})[id] ?? 0;
        const annualRate = stock.returns[yearIdx] ?? 0;
        const mRate      = Math.pow(1 + annualRate, 1 / 12) - 1;
        r.stocks[id]     = prev * (1 + mRate) + contribPerAlive;
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

// Bankruptcies fire at year boundaries; year = 1-indexed simulation year
function checkBankruptcies(prevAssets, yearNum, stockPicks) {
  return stockPicks.flatMap(id => {
    const stock = SIMULATION_STOCKS.find(s => s.id === id);
    if (stock?.bankruptYear !== yearNum) return [];
    const val = (prevAssets.stocks ?? {})[id] ?? 0;
    return val > 0 ? [{ stock, positionValue: val }] : [];
  });
}

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen({ initialSurplus, onStart }) {
  const defaultMonthly = Math.min(initialSurplus ?? 300, MAX_MONTHLY_INVESTABLE);
  const [monthly, setMonthly]       = useState(defaultMonthly);
  const [alloc, setAlloc]           = useState({ vtsax: 0, advisor: 0, stocks: 0, bonds: 0, gold: 0, cash: 100 });
  const [stockPicks, setStockPicks] = useState([]);

  const total       = Object.values(alloc).reduce((s, v) => s + v, 0);
  const remaining   = 100 - total;
  const needsStocks = alloc.stocks > 0;
  const stocksReady = !needsStocks || (stockPicks.length >= MIN_PICKS && stockPicks.length <= MAX_PICKS);
  const canStart    = total === 100 && stocksReady && monthly >= 50;

  function setAsset(asset, val) {
    setAlloc(prev => ({ ...prev, [asset]: Math.max(0, Math.min(100, val)) }));
  }
  function toggleStock(id) {
    setStockPicks(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
        : prev.length < MAX_PICKS ? [...prev, id] : prev
    );
  }

  const monthlySurplus = MONTHLY_INCOME - MONTHLY_BASE_EXPENSES_DEFAULT;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Market Simulator</p>
        <h2 className="text-2xl font-bold text-slate-900">20 years. Real markets. Real decisions.</h2>
        <p className="text-slate-500 text-sm mt-1">
          Set your monthly investment and allocate across 6 asset types. Life events — raises, weddings, childcare, crashes — will interrupt the simulation and force real decisions.
        </p>
      </div>

      {/* Monthly amount */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-800">Monthly investment</label>
          <span className="font-bold text-indigo-700">{fmtFull(monthly)}/mo</span>
        </div>
        <input type="range" min={50} max={MAX_MONTHLY_INVESTABLE} step={25} value={monthly}
          onChange={e => setMonthly(Number(e.target.value))}
          className="w-full accent-indigo-600" />
        <div className="flex justify-between text-xs text-slate-400">
          <span>$50/mo</span>
          <span>{fmtFull(MAX_MONTHLY_INVESTABLE)}/mo (your full surplus)</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
          Assumed: {fmtFull(MONTHLY_INCOME)}/mo take-home · {fmtFull(MONTHLY_BASE_EXPENSES_DEFAULT)}/mo base expenses · {fmtFull(monthlySurplus)}/mo surplus.
          You start with <strong>$3,000 in your checking account</strong>. Life events will draw from it.
        </div>
        {initialSurplus > 0 && (
          <p className="text-xs text-emerald-600">Suggested from your budget: {fmtFull(initialSurplus)}/mo</p>
        )}
      </div>

      {/* Allocation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-semibold text-slate-800">Investment allocation</p>
          <span className={`text-sm font-bold ${remaining === 0 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {remaining === 0 ? '✓ 100% allocated' : remaining > 0 ? `${remaining}% remaining` : `${-remaining}% over`}
          </span>
        </div>
        <p className="text-xs text-slate-500">Must total exactly 100%. Default is 100% HYSA — how most Americans actually keep their money. To invest, redistribute to other assets.</p>
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
                <input type="number" min={0} max={100} value={alloc[id]}
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
          <p className="text-xs text-slate-500">Companies shown by sector only. Names revealed at the end.</p>
          <div className="space-y-2">
            {SIMULATION_STOCKS.map(stock => {
              const selected = stockPicks.includes(stock.id);
              const disabled = !selected && stockPicks.length >= MAX_PICKS;
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

// ── Crash overlay ─────────────────────────────────────────────────────────────

function CrashOverlay({ event, byAsset, alloc, stockPicks, onConfirm }) {
  const sellableAssets = Object.entries(ASSET_LABELS).filter(([id]) => {
    if (id === 'cash') return false;
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

  function confirmMoves() {
    const moves = [];
    const newByAsset = { ...byAsset, stocks: { ...(byAsset.stocks ?? {}) } };
    let cashGain = 0;
    for (const [id] of sellableAssets) {
      const pct = exitPct[id] ?? 0;
      if (pct === 0) continue;
      const sellAmt = (currentValues[id] ?? 0) * (pct / 100);
      cashGain += sellAmt;
      moves.push({ asset: id, delta: -sellAmt });
      if (id === 'stocks') {
        const scale = 1 - pct / 100;
        for (const sid of Object.keys(newByAsset.stocks)) {
          newByAsset.stocks[sid] = (newByAsset.stocks[sid] ?? 0) * scale;
        }
      } else {
        newByAsset[id] = (currentValues[id] ?? 0) - sellAmt;
      }
    }
    newByAsset.cash = cashValue + cashGain;
    onConfirm({ moves, newByAsset });
  }

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
          <p className="text-xs text-slate-500 mb-1">Drag to sell a % of any asset and move it to High-Yield Savings (HYSA). Leave all at 0% to hold everything.</p>
          <p className="text-xs text-slate-400 mb-3 italic">Note: HYSA is a savings account within your investment portfolio — not the same as your checking account.</p>
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
                      Sell {pct}% = {fmtFull(Math.round(sellAmt))} → HYSA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4">0</span>
                  <input type="range" min={0} max={100} step={5}
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
        {totalExit > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <p className="text-xs text-amber-800">
              Moving <strong>{fmtFull(Math.round(totalExit))}</strong> to HYSA.
              New HYSA position: <strong>{fmtFull(Math.round(cashValue + totalExit))}</strong>.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={() => onConfirm({ moves: [] })}
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm">
            Hold everything
          </button>
          <button onClick={confirmMoves}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm">
            {totalExit > 0 ? 'Confirm moves →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lifestyle overlay ─────────────────────────────────────────────────────────

function LifestyleOverlay({ event, cashBalance, creditDebt, monthlyContrib, currentYear, hadDaycare, onConfirm }) {
  const yearsLeft = TOTAL_YEARS - currentYear;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Life event — Year {currentYear}</p>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{event.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{event.scenario}</p>
        </div>

        {event.year === 14 && hadDaycare && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
            <p className="text-xs text-emerald-700">✓ Your $2,800/mo childcare cost has been removed from your expenses.</p>
          </div>
        )}

        <div className="flex gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <div>
            <p className="text-xs text-slate-500">Checking account</p>
            <p className={`text-sm font-bold ${cashBalance < 2000 ? 'text-amber-700' : 'text-slate-800'}`}>
              {fmtFull(Math.round(cashBalance))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Currently investing</p>
            <p className="text-sm font-bold text-indigo-700">{fmtFull(monthlyContrib)}/mo</p>
          </div>
          {creditDebt > 0 && (
            <div>
              <p className="text-xs text-red-500">Credit card (24% APR)</p>
              <p className="text-sm font-bold text-red-700">{fmtFull(Math.round(creditDebt))}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {event.choices.map((choice, i) => {
            const { cost, benefit } = computeChoiceImpact(choice, yearsLeft);
            const newCash     = cashBalance + (choice.cashImpact ?? 0);
            const willOverdraft = newCash < 0;
            return (
              <button key={i}
                onClick={() => onConfirm({ choice })}
                className="w-full text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{choice.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{choice.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{choice.note}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {cost > 1000 && (
                        <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                          ~{fmt(cost)} less at Year 20
                        </span>
                      )}
                      {benefit > 1000 && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                          ~{fmt(benefit)} more at Year 20
                        </span>
                      )}
                      {willOverdraft && (
                        <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                          ⚠️ Goes into credit card debt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Bankruptcy overlay ────────────────────────────────────────────────────────

function BankruptcyOverlay({ bankruptcies, onConfirm }) {
  const totalLost = bankruptcies.reduce((s, b) => s + b.positionValue, 0);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-900">
            💀 {bankruptcies.length > 1 ? `${bankruptcies.length} companies went bankrupt` : 'Bankruptcy'}
          </p>
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
            <p className="text-xs text-red-800">Total lost: <strong>{fmtFull(Math.round(totalLost))}</strong></p>
          </div>
        )}
        <button onClick={onConfirm}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm">
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Debt intervention overlay ─────────────────────────────────────────────────

function DebtInterventionOverlay({ monthlyContrib, monthlyExpenses, creditDebt, onConfirm }) {
  const monthlyInterest = Math.round(creditDebt * 0.02);
  const fullSurplus     = MONTHLY_INCOME - monthlyExpenses;

  function projectPayoff(monthlyPayment) {
    if (monthlyPayment <= 0) return Infinity;
    let d = creditDebt;
    for (let m = 0; m < 480; m++) {
      d = d * 1.02 - monthlyPayment;
      if (d <= 0) return m + 1;
    }
    return Infinity;
  }

  const halfContrib = Math.round(monthlyContrib / 2);
  const monthsA     = projectPayoff(fullSurplus);
  const monthsB     = monthlyContrib > 0 ? projectPayoff(fullSurplus - halfContrib) : null;
  const monthsC     = projectPayoff(fullSurplus - monthlyContrib);

  // Projected debt in 12 months at current rate
  let projDebt = creditDebt;
  for (let m = 0; m < 12; m++) {
    projDebt = projDebt * 1.02 - Math.max(0, fullSurplus - monthlyContrib);
  }
  projDebt = Math.max(0, projDebt);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-900">⚠️ Credit card debt: {fmtFull(Math.round(creditDebt))}</p>
          <p className="text-xs text-red-700 mt-1">
            24% APR = {fmtFull(monthlyInterest)}/mo in interest.{' '}
            {monthsC === Infinity ? 'At this rate, your debt is growing faster than you can pay it.' : 'Your options:'}
          </p>
        </div>

        <p className="text-sm font-semibold text-slate-800">How do you want to handle this?</p>

        <button onClick={() => onConfirm({ newContrib: 0 })}
          className="w-full text-left border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-xl p-4 transition-all">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Pause investing — attack the debt</p>
              <p className="text-xs text-slate-500 mt-0.5">Invest $0/mo. Put {fmtFull(fullSurplus)}/mo surplus toward debt.</p>
              {monthsA !== Infinity
                ? <p className="text-xs font-semibold text-emerald-700 mt-1.5">Debt cleared in ~{monthsA} months. Then resume investing.</p>
                : <p className="text-xs text-amber-700 mt-1.5">Surplus doesn't cover interest — consider reducing expenses too.</p>}
            </div>
          </div>
        </button>

        {monthlyContrib > 0 && (
          <button onClick={() => onConfirm({ newContrib: halfContrib })}
            className="w-full text-left border border-amber-300 hover:bg-amber-50 rounded-xl p-4 transition-all">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Split — invest {fmtFull(halfContrib)}/mo, pay more to debt</p>
                <p className="text-xs text-slate-500 mt-0.5">Half the investing, more toward debt paydown.</p>
                {monthsB !== null && monthsB !== Infinity
                  ? <p className="text-xs font-semibold text-amber-700 mt-1.5">Debt cleared in ~{monthsB} months.</p>
                  : <p className="text-xs text-red-600 mt-1.5">Still not enough to cover monthly interest.</p>}
              </div>
            </div>
          </button>
        )}

        <button onClick={() => onConfirm({ newContrib: monthlyContrib })}
          className="w-full text-left border border-slate-200 hover:bg-slate-50 rounded-xl p-4 transition-all">
          <div className="flex items-start gap-3">
            <span className="text-2xl">😬</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Keep current pace</p>
              <p className="text-xs text-slate-500 mt-0.5">Continue investing {fmtFull(monthlyContrib)}/mo. Debt stays.</p>
              {monthsC !== Infinity
                ? <p className="text-xs text-slate-500 mt-1.5">Pays off in ~{monthsC} months at current rate.</p>
                : <p className="text-xs font-semibold text-red-700 mt-1.5">
                    Debt grows to ~{fmtFull(Math.round(projDebt))} by next year — then keeps growing.
                  </p>}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Financial panel (persistent sidebar) ─────────────────────────────────────

function FinancialPanel({ monthlyContrib, monthlyExpenses, cashDisplay, onContribChange }) {
  const EMERGENCY_CAP  = 6 * MONTHLY_BASE_EXPENSES_DEFAULT;
  const monthlyBuffer  = MONTHLY_INCOME - monthlyExpenses - monthlyContrib;
  const overInvesting  = monthlyBuffer < 0;

  function projectPayoffMonths() {
    if (cashDisplay.debt <= 0) return null;
    const surplus = MONTHLY_INCOME - monthlyExpenses - monthlyContrib;
    let d = cashDisplay.debt;
    for (let m = 0; m < 480; m++) {
      d = d * 1.02 - surplus;
      if (d <= 0) return m + 1;
    }
    return Infinity;
  }
  const payoffMonths = projectPayoffMonths();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 lg:sticky lg:top-4">
      {/* Budget */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly budget</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Take-home</span>
            <span className="font-semibold text-slate-700">{fmtFull(MONTHLY_INCOME)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expenses</span>
            <span className="font-semibold text-red-500">−{fmtFull(monthlyExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Investing</span>
            <span className="font-semibold text-indigo-600">−{fmtFull(monthlyContrib)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5">
            <span className="font-semibold text-slate-700">Buffer</span>
            <span className={`font-bold ${monthlyBuffer >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {monthlyBuffer >= 0 ? `+${fmtFull(monthlyBuffer)}/mo` : `−${fmtFull(Math.abs(monthlyBuffer))}/mo`}
            </span>
          </div>
        </div>
        {overInvesting && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-2">
            ⚠ Investing more than surplus — checking will drain.
          </p>
        )}
      </div>

      {/* Live investment slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-700">Monthly investment</span>
          <span className="text-xs font-bold text-indigo-700">{fmtFull(monthlyContrib)}/mo</span>
        </div>
        <input type="range" min={0} max={MAX_MONTHLY_INVESTABLE} step={25}
          value={monthlyContrib}
          onChange={e => onContribChange(Number(e.target.value))}
          className="w-full accent-indigo-600"
          style={{ height: '6px' }}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>$0</span>
          <span>{fmtFull(MAX_MONTHLY_INVESTABLE)} max</span>
        </div>
      </div>

      {/* Accounts */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accounts</p>

        <div className="text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Checking</span>
            <span className={`font-semibold ${cashDisplay.balance < 1000 ? 'text-amber-600' : 'text-slate-700'}`}>
              {fmtFull(Math.round(cashDisplay.balance))}
            </span>
          </div>
          <p className="text-slate-400 mt-0.5">
            {cashDisplay.debt > 0         ? 'Surplus redirected to debt'
              : cashDisplay.balance >= EMERGENCY_CAP ? 'At 6-month cap'
              : monthlyBuffer > 0         ? `+${fmtFull(monthlyBuffer)}/mo`
              : monthlyBuffer < 0         ? `Draining ${fmtFull(Math.abs(monthlyBuffer))}/mo`
              : 'Stable'}
          </p>
        </div>

        {cashDisplay.debt > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span className="text-red-700 font-semibold">CC Debt (24% APR)</span>
              <span className="font-bold text-red-700">{fmtFull(Math.round(cashDisplay.debt))}</span>
            </div>
            <p className="text-red-500 mt-0.5">
              {fmtFull(Math.round(cashDisplay.debt * 0.02))}/mo interest
            </p>
            {payoffMonths === Infinity && (
              <p className="text-red-700 font-semibold mt-0.5">⚠ Debt is growing — reduce investing ↑</p>
            )}
            {payoffMonths !== null && payoffMonths !== Infinity && (
              <p className="text-slate-500 mt-0.5">~{payoffMonths} months to pay off</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function SimTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const yr = Math.floor(label / 12) + 1;
  const mo = (label % 12) + 1;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow text-xs space-y-1">
      <p className="font-semibold text-slate-700">Year {yr}, Month {mo}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

// ── Reveal screen ─────────────────────────────────────────────────────────────

function RevealScreen({ history, finalPortfolio, alloc, stockPicks, panicMoves, initialMonthly, lifestyleChoices, finalCash, finalDebt, onReset }) {
  const lastPoint   = history[history.length - 1] ?? {};
  const finalTotal  = totalPortfolio(finalPortfolio);
  const finalVtsax  = lastPoint.vtsaxBenchmark ?? 0;
  const finalCashBM = lastPoint.cashBenchmark  ?? 0;

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

  const panicDetails = panicMoves.filter(m => m.delta < 0).map(m => {
    const sold     = Math.abs(m.delta);
    const yearIdx  = Math.floor((m.month ?? m.year * 12) / 12); // support legacy year field
    let compounded = sold;
    for (let i = yearIdx + 1; i < TOTAL_YEARS; i++) compounded *= (1 + RETURNS.vtsax[i]);
    return { ...m, sold, opportunityCost: compounded - sold, displayYear: yearIdx + 1 };
  });
  const totalPanicCost = panicDetails.reduce((s, d) => s + d.opportunityCost, 0);

  const selectedStocks = SIMULATION_STOCKS.filter(s => stockPicks.includes(s.id));
  const chartData      = history.map((p, i) => ({ month: i, ...p }));

  const totalLifestyleCost    = lifestyleChoices.reduce((s, lc) => s + (lc.opportunityCost ?? 0), 0);
  const totalLifestyleBenefit = lifestyleChoices.reduce((s, lc) => s + (lc.opportunitySaving ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">20 years complete</p>
          <h2 className="text-2xl font-bold text-slate-900">Here's what happened.</h2>
        </div>
        <button onClick={onReset}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-colors">
          Try a different strategy →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-indigo-600 mb-1">Your portfolio</p>
          <p className="text-2xl font-bold text-indigo-800">{fmt(finalTotal)}</p>
          <p className="text-xs text-indigo-500 mt-1">nominal value</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-600 mb-1">100% Index fund (VTSAX)</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(finalVtsax)}</p>
          <p className="text-xs text-emerald-500 mt-1">same {fmtFull(initialMonthly)}/mo, no decisions</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-1">100% Cash / HYSA</p>
          <p className="text-2xl font-bold text-slate-600">{fmt(finalCashBM)}</p>
          <p className="text-xs text-slate-400 mt-1">the "safe" choice</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Final checking account</p>
          <p className={`text-xl font-bold ${finalCash > 5000 ? 'text-emerald-700' : finalCash < 1000 ? 'text-amber-700' : 'text-slate-800'}`}>
            {fmtFull(Math.round(finalCash))}
          </p>
        </div>
        <div className={`rounded-xl p-4 ${finalDebt > 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          <p className={`text-xs font-semibold mb-1 ${finalDebt > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {finalDebt > 0 ? 'Credit card debt' : 'No credit card debt'}
          </p>
          <p className={`text-xl font-bold ${finalDebt > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {finalDebt > 0 ? fmtFull(Math.round(finalDebt)) : '$0'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Your 20-year journey</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }}
                tickFormatter={v => v % 12 === 0 && v > 0 ? `Yr ${v / 12}` : ''}
                label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fontSize: 10 }}
              />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={55} />
              <ReTooltip content={<SimTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {MARKET_EVENTS.map(e => (
                <ReferenceLine key={e.year} x={(e.year - 1) * 12} stroke="#ef4444" strokeDasharray="3 3"
                  label={{ value: '⚠', position: 'top', fontSize: 10 }} />
              ))}
              <Line type="monotone" dataKey="total" name="Your portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vtsaxBenchmark" name="VTSAX benchmark" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

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

      {lifestyleChoices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Your life decisions</p>
            <p className="text-xs text-slate-500 mt-0.5">Each choice's dollar impact, compounded to Year 20 at 7% real return.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {lifestyleChoices.map((lc, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Year {lc.year}: {lc.title}</p>
                  <p className="text-xs text-slate-500">{lc.choiceLabel}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {(lc.opportunityCost ?? 0) > 500 && (
                    <p className="text-xs font-semibold text-red-600">−{fmt(lc.opportunityCost)}</p>
                  )}
                  {(lc.opportunitySaving ?? 0) > 500 && (
                    <p className="text-xs font-semibold text-emerald-600">+{fmt(lc.opportunitySaving)}</p>
                  )}
                  {lc.lumpSumLoss && (
                    <p className="text-xs font-semibold text-red-600">$8,000 lost</p>
                  )}
                  {(lc.opportunityCost ?? 0) < 500 && (lc.opportunitySaving ?? 0) < 500 && !lc.lumpSumLoss && (
                    <p className="text-xs text-slate-400">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(totalLifestyleCost > 1000 || totalLifestyleBenefit > 1000) && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-700">Net lifestyle impact at Year 20</p>
              <p className={`text-xs font-bold ${totalLifestyleBenefit > totalLifestyleCost ? 'text-emerald-700' : 'text-red-700'}`}>
                {totalLifestyleBenefit > totalLifestyleCost
                  ? `+${fmt(totalLifestyleBenefit - totalLifestyleCost)}`
                  : `−${fmt(totalLifestyleCost - totalLifestyleBenefit)}`}
              </p>
            </div>
          )}
        </div>
      )}

      {panicDetails.length > 0 && totalPanicCost > 500 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-900">The cost of selling during crashes</p>
          {panicDetails.map((d, i) => (
            <div key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
              Year {d.displayYear}: Moved {fmtFull(Math.round(d.sold))} out of {ASSET_LABELS[d.asset]}.
              If held in VTSAX: <strong>+{fmt(d.opportunityCost)}</strong> more by Year 20.
            </div>
          ))}
          <p className="text-xs font-semibold text-red-800">
            Total cost of not staying the course: ~{fmt(totalPanicCost)}
          </p>
        </div>
      )}

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

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-indigo-900">In today's purchasing power</p>
        <p className="text-sm text-indigo-700">
          After ~{Math.round((inflationFactor - 1) * 100)}% cumulative inflation over 20 years, your {fmt(finalTotal)} is worth approximately{' '}
          <strong>{fmt(realValue)}</strong> in 2004 dollars.
        </p>
        <p className="text-xs text-indigo-600 mt-1">
          Approximately <strong>{getPercentile(finalTotal)}</strong> percentile of American retirement savings.{' '}
          Source: Federal Reserve Survey of Consumer Finances 2022.
        </p>
      </div>

      <button onClick={onReset}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-sm transition-colors">
        Try a different strategy →
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarketSimulator({ initialSurplus = 300 }) {
  const [phase, setPhase]               = useState('SETUP');
  const [config, setConfig]             = useState(null);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [byAsset, setByAsset]           = useState({});
  const [monthlyContrib, setMonthlyContrib] = useState(300);
  const [history, setHistory]           = useState([]);
  const [activeEvent, setActiveEvent]   = useState(null);
  const [panicMoves, setPanicMoves]     = useState([]);
  const [pendingBankruptcies, setPendingBankruptcies] = useState([]);
  const [lifestyleChoices, setLifestyleChoices]       = useState([]);

  // Refs — synchronous access inside setInterval callbacks
  const cashRef                 = useRef(3000);
  const creditRef               = useRef(0);
  const expensesRef             = useRef(MONTHLY_BASE_EXPENSES_DEFAULT);
  const hadDaycareRef           = useRef(false);
  const monthlyContribRef       = useRef(300);      // source of truth for interval; state is for display
  const debtInterventionFiredRef = useRef(false);   // only fire debt intervention once

  const [cashDisplay, setCashDisplay]       = useState({ balance: 3000, debt: 0 });
  const [monthlyExpenses, setMonthlyExpenses] = useState(MONTHLY_BASE_EXPENSES_DEFAULT);

  const vtsaxBenchRef = useRef(0);
  const cashBenchRef  = useRef(0);

  const [simSpeed, setSimSpeed]   = useState(150); // ms per month
  const [simPaused, setSimPaused] = useState(false);

  const intervalRef = useRef(null);

  // Keep monthlyContribRef in sync when state changes (e.g. after lifestyle events)
  useEffect(() => { monthlyContribRef.current = monthlyContrib; }, [monthlyContrib]);

  function handleContribChange(val) {
    monthlyContribRef.current = val; // instant — no interval restart
    setMonthlyContrib(val);
  }

  function advanceOneMonth() {
    if (!config) return;
    const { alloc, stockPicks } = config;
    const mc = monthlyContribRef.current;

    setCurrentMonth(prevMonth => {
      if (prevMonth >= TOTAL_MONTHS) return prevMonth;

      const yearIdx = Math.floor(prevMonth / 12); // 0-19

      setByAsset(prev => {
        const newAssets = computePortfolioAfterMonth(prev, alloc, mc, prevMonth, stockPicks);
        const total     = totalPortfolio(newAssets);

        // Benchmarks (monthly rate)
        const vtsaxAnnual = RETURNS.vtsax[yearIdx] ?? 0;
        const cashAnnual  = RETURNS.cash[yearIdx]  ?? 0;
        const vtsaxMonthly = Math.pow(1 + vtsaxAnnual, 1 / 12) - 1;
        const cashMonthly  = Math.pow(1 + cashAnnual,  1 / 12) - 1;
        const newVtsax = vtsaxBenchRef.current * (1 + vtsaxMonthly) + mc;
        const newCash  = cashBenchRef.current  * (1 + cashMonthly)  + mc;
        vtsaxBenchRef.current = newVtsax;
        cashBenchRef.current  = newCash;

        setHistory(h => [...h, { total, vtsaxBenchmark: newVtsax, cashBenchmark: newCash }]);

        // Monthly cash flow
        const monthlyNet = MONTHLY_INCOME - expensesRef.current - mc;
        let newCashBal   = cashRef.current + monthlyNet;

        // Credit card: 2%/month (24% APR ÷ 12)
        if (creditRef.current > 0) {
          const interest = Math.round(creditRef.current * 0.02);
          newCashBal -= interest;
        }

        if (newCashBal < 0) {
          creditRef.current += Math.abs(newCashBal);
          newCashBal = 0;
        } else if (creditRef.current > 0) {
          const payment = Math.min(newCashBal, creditRef.current);
          creditRef.current -= payment;
          newCashBal -= payment;
        }

        const EMERGENCY_FUND_CAP = 6 * MONTHLY_BASE_EXPENSES_DEFAULT;
        if (newCashBal > EMERGENCY_FUND_CAP) newCashBal = EMERGENCY_FUND_CAP;
        cashRef.current = newCashBal;

        // Debt intervention threshold
        if (creditRef.current > 5000 && !debtInterventionFiredRef.current) {
          debtInterventionFiredRef.current = true;
          clearInterval(intervalRef.current);
          setPhase('PAUSED_DEBT_INTERVENTION');
          return newAssets;
        }

        // Events fire at year boundaries (every 12 months)
        const nextMonth  = prevMonth + 1;
        if (nextMonth % 12 === 0) {
          const nextYearNum = Math.floor(nextMonth / 12) + 1; // 1-indexed
          const bkr = checkBankruptcies(prev, nextYearNum, stockPicks);
          const mkt = MARKET_EVENTS.find(e => e.year === nextYearNum);
          const lfe = LIFESTYLE_EVENTS.find(e => e.year === nextYearNum);

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
            if (lfe.year === 14 && hadDaycareRef.current) {
              expensesRef.current = Math.max(MONTHLY_BASE_EXPENSES_DEFAULT, expensesRef.current - 2800);
              setMonthlyExpenses(prev => Math.max(MONTHLY_BASE_EXPENSES_DEFAULT, prev - 2800));
            }
            setActiveEvent(lfe);
            setPhase('PAUSED_LIFESTYLE');
          }
        }

        if (prevMonth + 1 >= TOTAL_MONTHS) {
          clearInterval(intervalRef.current);
          setPhase('REVEAL');
        }

        return newAssets;
      });

      setCashDisplay({ balance: cashRef.current, debt: creditRef.current });
      return prevMonth + 1;
    });
  }

  useEffect(() => {
    if (phase !== 'RUNNING' || simPaused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advanceOneMonth, simSpeed);
    return () => clearInterval(intervalRef.current);
  }, [phase, config, simSpeed, simPaused]); // monthlyContrib intentionally excluded — handled via ref

  function handleStart({ monthly, alloc, stockPicks }) {
    const initial = { vtsax: 0, advisor: 0, bonds: 0, gold: 0, cash: 0, stocks: {} };
    for (const id of stockPicks) initial.stocks[id] = 0;

    vtsaxBenchRef.current          = 0;
    cashBenchRef.current           = 0;
    cashRef.current                = 3000;
    creditRef.current              = 0;
    expensesRef.current            = MONTHLY_BASE_EXPENSES_DEFAULT;
    hadDaycareRef.current          = false;
    monthlyContribRef.current      = monthly;
    debtInterventionFiredRef.current = false;

    setByAsset(initial);
    setMonthlyContrib(monthly);
    setConfig({ monthly, alloc, stockPicks });
    setCurrentMonth(0);
    setHistory([{ total: 0, vtsaxBenchmark: 0, cashBenchmark: 0 }]);
    setPanicMoves([]);
    setLifestyleChoices([]);
    setCashDisplay({ balance: 3000, debt: 0 });
    setMonthlyExpenses(MONTHLY_BASE_EXPENSES_DEFAULT);
    setSimPaused(false);
    setPhase('RUNNING');
  }

  function handleReset() {
    vtsaxBenchRef.current          = 0;
    cashBenchRef.current           = 0;
    cashRef.current                = 3000;
    creditRef.current              = 0;
    expensesRef.current            = MONTHLY_BASE_EXPENSES_DEFAULT;
    hadDaycareRef.current          = false;
    monthlyContribRef.current      = 300;
    debtInterventionFiredRef.current = false;

    setPhase('SETUP');
    setConfig(null);
    setCurrentMonth(0);
    setByAsset({});
    setMonthlyContrib(300);
    setHistory([]);
    setPanicMoves([]);
    setLifestyleChoices([]);
    setActiveEvent(null);
    setPendingBankruptcies([]);
    setCashDisplay({ balance: 3000, debt: 0 });
    setMonthlyExpenses(MONTHLY_BASE_EXPENSES_DEFAULT);
    setSimPaused(false);
  }

  function handleCrashConfirm({ moves, newByAsset }) {
    if (moves?.length > 0 && newByAsset) {
      setByAsset(() => newByAsset);
      setPanicMoves(pm => [...pm, ...moves.map(m => ({ ...m, month: currentMonth }))]);
    }
    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleLifestyleConfirm({ choice }) {
    const displayYear = Math.floor(currentMonth / 12) + 1;
    const yearsLeft   = TOTAL_YEARS - displayYear + 1;
    const { cost, benefit } = computeChoiceImpact(choice, yearsLeft);

    if (activeEvent?.year === 7 && (choice.monthlyExpenseDelta ?? 0) >= 2800) {
      hadDaycareRef.current = true;
    }

    if (choice.cashImpact) {
      const newBal = cashRef.current + choice.cashImpact;
      if (newBal < 0) {
        creditRef.current += Math.abs(newBal);
        cashRef.current    = 0;
      } else {
        cashRef.current = newBal;
      }
      setCashDisplay({ balance: cashRef.current, debt: creditRef.current });
    }

    if (choice.loanAmount > 0) {
      creditRef.current += choice.loanAmount;
      setCashDisplay({ balance: cashRef.current, debt: creditRef.current });
    }

    if (choice.monthlyExpenseDelta) {
      expensesRef.current += choice.monthlyExpenseDelta;
      setMonthlyExpenses(prev => prev + choice.monthlyExpenseDelta);
    }

    if (choice.monthlyContribDelta) {
      const newVal = Math.max(0, monthlyContribRef.current + choice.monthlyContribDelta);
      monthlyContribRef.current = newVal;
      setMonthlyContrib(newVal);
    }

    if (choice.investLumpSum > 0) {
      setByAsset(prev => {
        const updated = { ...prev, stocks: { ...(prev.stocks ?? {}) } };
        const { alloc, stockPicks } = config;
        for (const [id, pct] of Object.entries(alloc)) {
          if (!pct) continue;
          if (id === 'stocks' && stockPicks.length > 0) {
            const perStock = choice.investLumpSum * (pct / 100) / stockPicks.length;
            for (const sid of stockPicks) {
              updated.stocks[sid] = (updated.stocks[sid] ?? 0) + perStock;
            }
          } else if (id !== 'stocks') {
            updated[id] = (updated[id] ?? 0) + choice.investLumpSum * (pct / 100);
          }
        }
        return updated;
      });
      vtsaxBenchRef.current += choice.investLumpSum;
      cashBenchRef.current  += choice.investLumpSum;
    }

    setLifestyleChoices(prev => [...prev, {
      year:            displayYear,
      title:           activeEvent.title,
      choiceLabel:     choice.label,
      opportunityCost: cost,
      opportunitySaving: benefit,
      lumpSumLoss:     choice.lumpSumLoss ?? false,
    }]);

    setActiveEvent(null);
    setPhase('RUNNING');
  }

  function handleBankruptcyConfirm() {
    setPendingBankruptcies([]);
    const displayYear = Math.floor(currentMonth / 12) + 1;
    const marketEvent = MARKET_EVENTS.find(e => e.year === displayYear);
    if (marketEvent) {
      setActiveEvent(marketEvent);
      setPhase('PAUSED_MARKET');
    } else {
      setPhase('RUNNING');
    }
  }

  function handleDebtInterventionConfirm({ newContrib }) {
    monthlyContribRef.current = newContrib;
    setMonthlyContrib(newContrib);
    setPhase('RUNNING');
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
        lifestyleChoices={lifestyleChoices}
        finalCash={cashDisplay.balance}
        finalDebt={cashDisplay.debt}
        onReset={handleReset}
      />
    );
  }

  const displayYear   = Math.floor(currentMonth / 12) + 1;
  const currentTotal  = totalPortfolio(byAsset);
  const vtsaxCurrent  = vtsaxBenchRef.current;
  const yearContext   = YEAR_CONTEXT[displayYear] ?? null;

  // Pre-event warning: look 12 months ahead (last 12 months before any lifestyle event)
  const upcomingEvent = LIFESTYLE_EVENTS.find(e =>
    currentMonth >= e.year * 12 - 12 && currentMonth < e.year * 12
  );

  const chartData = history.map((p, i) => ({ month: i, ...p }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
          cashBalance={cashDisplay.balance}
          creditDebt={cashDisplay.debt}
          monthlyContrib={monthlyContrib}
          currentYear={displayYear}
          hadDaycare={hadDaycareRef.current}
          onConfirm={handleLifestyleConfirm}
        />
      )}
      {phase === 'PAUSED_BANKRUPTCY' && pendingBankruptcies.length > 0 && (
        <BankruptcyOverlay
          bankruptcies={pendingBankruptcies}
          onConfirm={handleBankruptcyConfirm}
        />
      )}
      {phase === 'PAUSED_DEBT_INTERVENTION' && (
        <DebtInterventionOverlay
          monthlyContrib={monthlyContrib}
          monthlyExpenses={monthlyExpenses}
          creditDebt={cashDisplay.debt}
          onConfirm={handleDebtInterventionConfirm}
        />
      )}

      {/* Two-column layout: main content + financial panel */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

        {/* ── Main content column ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Market Simulator</p>
              <h2 className="text-xl font-bold text-slate-900">
                Year {displayYear} of {TOTAL_YEARS}
                <span className="text-sm font-normal text-slate-400 ml-2">Month {(currentMonth % 12) + 1}</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Portfolio</p>
              <p className="text-xl font-bold text-indigo-700">{fmt(currentTotal)}</p>
              {vtsaxCurrent > 0 && (
                <p className={`text-xs font-semibold ${currentTotal >= vtsaxCurrent ? 'text-emerald-600' : 'text-red-500'}`}>
                  {currentTotal >= vtsaxCurrent ? `+${fmt(currentTotal - vtsaxCurrent)}` : `${fmt(currentTotal - vtsaxCurrent)}`} vs VTSAX
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentMonth / TOTAL_MONTHS) * 100}%` }} />
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSimPaused(p => !p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                simPaused ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}>
              {simPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <span className="text-xs text-slate-400">Speed:</span>
            {[{ label: '1×', ms: 150 }, { label: '3×', ms: 50 }, { label: '10×', ms: 10 }].map(({ label, ms }) => (
              <button key={ms} onClick={() => setSimSpeed(ms)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  simSpeed === ms ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Pre-event warning */}
          {upcomingEvent && phase === 'RUNNING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <span className="text-base flex-shrink-0 mt-0.5">🔔</span>
              <div>
                <p className="text-xs font-semibold text-amber-800">Coming up in about a year: {upcomingEvent.title}</p>
                <p className="text-xs text-amber-700 mt-0.5">{upcomingEvent.prepTip}</p>
              </div>
            </div>
          )}

          {/* Year context */}
          {yearContext && phase === 'RUNNING' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Year {displayYear}:</span> {yearContext}
              </p>
            </div>
          )}

          {/* Live chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Portfolio vs. VTSAX benchmark</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }}
                    tickFormatter={v => v % 12 === 0 && v > 0 ? `Yr ${v / 12}` : ''}
                  />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={55} />
                  <ReTooltip content={<SimTooltip />} />
                  {MARKET_EVENTS.filter(e => e.year <= displayYear).map(e => (
                    <ReferenceLine key={e.year} x={(e.year - 1) * 12} stroke="#ef4444" strokeDasharray="3 3" />
                  ))}
                  <Line type="monotone" dataKey="total" name="Your portfolio" stroke="#6366f1" strokeWidth={2.5} dot={false} isAnimationActive={false} />
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

        </div>{/* end main column */}

        {/* ── Financial panel column ── */}
        <div className="lg:col-span-1">
          <FinancialPanel
            monthlyContrib={monthlyContrib}
            monthlyExpenses={monthlyExpenses}
            cashDisplay={cashDisplay}
            onContribChange={handleContribChange}
          />
        </div>

      </div>{/* end grid */}
    </div>
  );
}
