import { useState, useMemo } from 'react';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';
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

const RETURN_PRESETS = [
  { label: 'HYSA', rate: 0.045, description: 'High-yield savings account (~4.5%)' },
  { label: 'Bonds', rate: 0.05, description: 'Bond index fund (~5%)' },
  { label: 'Index fund', rate: 0.07, description: 'S&P 500 index fund (historical avg ~7% after inflation)' },
  { label: 'Aggressive', rate: 0.10, description: 'Growth stocks / 100% equity (~10% historical, more volatile)' },
];

const YEARS = [3, 5, 10, 20, 30, 40];

export default function InvestingFlow({ budgetSurplus }) {
  const [showPaths, setShowPaths] = useState(true);
  const [surplus, setSurplus] = useState(budgetSurplus ?? 300);
  const [debtBalance, setDebtBalance] = useState(3000);
  const [debtRate, setDebtRate] = useState(0.24);
  const [investRateIdx, setInvestRateIdx] = useState(2); // index fund default
  const [expenseRatio, setExpenseRatio] = useState(0.0003); // 0.03% index fund default
  const [accountType, setAccountType] = useState('roth');
  const [matchEnabled, setMatchEnabled] = useState(true);
  const [horizon, setHorizon] = useState(30);

  const investRate = RETURN_PRESETS[investRateIdx].rate;
  const netRate = Math.max(0, investRate - expenseRatio);

  // Tax multiplier: Roth = full value (tax-free), Traditional = ~75%, Taxable = ~85%
  const TAX_MULT = { roth: 1.0, traditional: 0.75, taxable: 0.85 };
  const taxMult = TAX_MULT[accountType] ?? 1.0;

  // 401k match: employer matches 3% of salary up to employee contributing 3%
  const SALARY = 72500;
  const MATCH_CAP_ANNUAL = SALARY * 0.03; // $1,950/yr = $162.50/mo
  const matchMonthly = matchEnabled ? Math.min(surplus, MATCH_CAP_ANNUAL / 12) : 0;
  const effectiveMonthly = surplus + matchMonthly;

  // Debt: monthly interest cost
  const monthlyInterest = debtBalance > 0 ? debtBalance * (debtRate / 12) : 0;
  const debtPayment = Math.min(surplus, debtBalance > 0 ? Math.max(25, monthlyInterest + 50) : 0);
  const payoffMonths = debtPayoffMonths(debtBalance, debtRate, debtPayment);
  const surplusAfterDebt = Math.max(0, surplus - debtPayment);

  // Scenario A: Do nothing — savings account at 0.5%
  // Scenario B: Invest from day one (ignore debt)
  // Scenario C: Pay off debt first, then invest full surplus + match

  const scenarioA = useMemo(() => futureValue(surplus * 0.01 / 12 > 0 ? surplus : surplus, 0.005, horizon), [surplus, horizon]);

  const scenarioB = useMemo(() => futureValue(effectiveMonthly, netRate, horizon) * taxMult, [effectiveMonthly, netRate, horizon, taxMult]);

  const scenarioC = useMemo(() => {
    if (debtBalance <= 0 || payoffMonths === Infinity) return futureValue(effectiveMonthly, netRate, horizon) * taxMult;
    const debtYears = payoffMonths / 12;
    if (debtYears >= horizon) return 0;
    const remainingYears = horizon - debtYears;
    const fullContrib = surplus;
    const effectiveFull = matchEnabled ? fullContrib + Math.min(fullContrib, MATCH_CAP_ANNUAL / 12) : fullContrib;
    return futureValue(effectiveFull, netRate, remainingYears) * taxMult;
  }, [debtBalance, debtRate, payoffMonths, surplus, netRate, horizon, matchEnabled, surplusAfterDebt, taxMult]);

  const chartData = useMemo(() => {
    return YEARS.filter((y) => y <= horizon + 1).map((y) => ({
      year: y,
      age: 22 + y,
      doNothing: Math.round(futureValue(surplus, 0.005, y)),
      investNow: Math.round(futureValue(effectiveMonthly, netRate, y) * taxMult),
      payDebtFirst: (() => {
        if (debtBalance <= 0) return Math.round(futureValue(effectiveMonthly, netRate, y) * taxMult);
        const dm = payoffMonths / 12;
        if (dm >= y) return 0;
        const rem = y - dm;
        const eff = matchEnabled ? surplus + Math.min(surplus, MATCH_CAP_ANNUAL / 12) : surplus;
        return Math.round(futureValue(eff, netRate, rem) * taxMult);
      })(),
    }));
  }, [surplus, effectiveMonthly, netRate, debtBalance, payoffMonths, horizon, matchEnabled, taxMult]);

  const lateStartValue = useMemo(() => {
    const yearsRemaining = horizon - 10;
    if (yearsRemaining <= 0) return 0;
    return futureValue(effectiveMonthly, netRate, yearsRemaining) * taxMult;
  }, [effectiveMonthly, netRate, horizon, taxMult]);

  return (
    <div className="max-w-md mx-auto space-y-5 px-4 py-5">
      <div>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-0.5">Grade 11 · Compound Interest</p>
        <h2 className="text-xl font-bold text-slate-900">What happens to your money over time?</h2>
        <p className="text-slate-500 text-sm">Adjust the inputs. Watch the chart change.</p>
      </div>

      {budgetSurplus !== null && budgetSurplus > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-emerald-800 text-sm font-medium">
            You built <span className="font-bold">${budgetSurplus.toLocaleString()}/mo</span> in surplus from your 10th grade budget — that's your starting investment amount.
          </p>
        </div>
      )}
      {budgetSurplus !== null && budgetSurplus <= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-amber-800 text-sm font-medium">
            Your 10th grade budget left no surplus. Use the slider below to explore what investing even a small amount each month can do.
          </p>
        </div>
      )}

      {/* Persona paths — shown first, collapses when student is ready to build their own */}
      {showPaths ? (
        <PersonaPaths onDone={() => setShowPaths(false)} />
      ) : (
        <button
          onClick={() => setShowPaths(true)}
          className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 text-center"
        >
          ↑ Show character comparisons again
        </button>
      )}

      {/* Surplus input */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800 flex items-center">
            Monthly surplus to invest
            <Tooltip text="Money left after all your monthly expenses. From your budget in 10th grade." />
          </label>
          <span className="text-indigo-700 font-bold">{fmtFull(surplus)}</span>
        </div>
        <input
          type="range"
          min={50}
          max={TAKE_HOME_MONTHLY}
          step={25}
          value={surplus}
          onChange={(e) => setSurplus(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>$50/mo</span>
          <span>{fmtFull(TAKE_HOME_MONTHLY)} (full take-home)</span>
        </div>
      </div>

      {/* Contribution comparison — "what if I saved more?" */}
      {(() => {
        const half = Math.max(50, Math.round(surplus / 2));
        const double = Math.min(TAKE_HOME_MONTHLY, surplus * 2);
        const fvHalf   = futureValue(half,   netRate, horizon) * taxMult;
        const fvNow    = futureValue(surplus, netRate, horizon) * taxMult;
        const fvDouble = futureValue(double,  netRate, horizon) * taxMult;
        const extra = fvDouble - fvNow;
        return (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">What if you saved more?</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ label: `${fmt(half)}/mo`, val: fvHalf, note: 'Half' }, { label: `${fmt(surplus)}/mo`, val: fvNow, note: 'Current' }, { label: `${fmt(double)}/mo`, val: fvDouble, note: 'Double' }].map((s) => (
                <div key={s.note} className={`rounded-lg p-2 ${s.note === 'Current' ? 'bg-indigo-100 border border-indigo-300' : 'bg-white border border-slate-200'}`}>
                  <p className="text-xs text-slate-500">{s.note}</p>
                  <p className={`text-xs font-medium ${s.note === 'Current' ? 'text-indigo-700' : 'text-slate-600'}`}>{s.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${s.note === 'Current' ? 'text-indigo-800' : 'text-slate-700'}`}>{fmt(s.val)}</p>
                </div>
              ))}
            </div>
            {extra > 5000 && (
              <p className="text-xs text-slate-500">Doubling your investment = <strong className="text-slate-700">{fmt(extra)} more</strong> at age {22 + horizon}.</p>
            )}
          </div>
        );
      })()}

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
          type="range"
          min={0}
          max={20000}
          step={500}
          value={debtBalance}
          onChange={(e) => setDebtBalance(Number(e.target.value))}
          className="w-full accent-red-500"
        />
        {debtBalance > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 space-y-0.5">
            <p>💸 Monthly interest: <strong>{fmtFull(Math.round(monthlyInterest))}</strong> just to stand still</p>
            {payoffMonths !== Infinity && (
              <p>⏱ Payoff time: ~<strong>{payoffMonths < 12 ? `${payoffMonths} months` : `${Math.round(payoffMonths / 12 * 10) / 10} years`}</strong></p>
            )}
          </div>
        )}
        {/* APR selector */}
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
          <p className="text-xs text-slate-400 mt-1.5">✓ Best practice: auto-pay the full balance every month. The APR only matters if you carry a balance.</p>
        </div>
      </div>

      {/* Return rate */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-800 flex items-center">
          Investment type
          <Tooltip text="Higher return = more risk + volatility. Index funds track the whole stock market. Past returns don't guarantee future results." />
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {RETURN_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setInvestRateIdx(i)}
              className={`rounded-lg py-2 text-center text-xs font-semibold border transition-all ${
                investRateIdx === i
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div>{p.label}</div>
              <div className={`text-xs mt-0.5 ${investRateIdx === i ? 'text-indigo-200' : 'text-slate-400'}`}>
                {Math.round(p.rate * 100)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expense ratio */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-800 flex items-center">
          Fund expense ratio
          <Tooltip text="The annual fee a fund charges, taken silently from your returns every year. Index funds charge almost nothing. Actively managed funds charge 30–100x more for the same or worse performance." />
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ label: 'Index fund', ratio: 0.0003, note: '0.03% · Vanguard VTSAX' }, { label: 'Blended', ratio: 0.005, note: '0.50% · Target-date' }, { label: 'Actively managed', ratio: 0.01, note: '1.00% · Most mutual funds' }].map((opt) => (
            <button key={opt.ratio} onClick={() => setExpenseRatio(opt.ratio)}
              className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all ${expenseRatio === opt.ratio ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
              <div className="leading-tight">{opt.label}</div>
              <div className={`text-xs mt-0.5 leading-tight ${expenseRatio === opt.ratio ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.note}</div>
            </button>
          ))}
        </div>
        {(() => {
          const feeImpact = futureValue(effectiveMonthly, investRate, horizon) - futureValue(effectiveMonthly, netRate, horizon);
          return feeImpact > 500 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              At {(expenseRatio * 100).toFixed(2)}% fees, the fund manager takes <strong>{fmt(feeImpact)}</strong> of your retirement over {horizon} years.
              {expenseRatio > 0.0003 && <span className="text-amber-700"> An index fund (0.03%) would keep that for you.</span>}
              <span className="block text-amber-600 mt-0.5">Source: SmartAsset expense ratio analysis · S&P SPIVA report</span>
            </div>
          ) : null;
        })()}
      </div>

      {/* 401k match toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center">
              401(k) employer match
              <Tooltip text="Many employers match your 401k contributions up to 3% of salary. That's free money — an instant 100% return on matched dollars." />
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {matchEnabled
                ? `+${fmtFull(Math.round(matchMonthly))}/mo free from employer`
                : 'You\'re leaving money on the table'}
            </p>
          </div>
          <button
            onClick={() => setMatchEnabled((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${matchEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${matchEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </div>

      {/* Account type: Roth vs Traditional */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-800 flex items-center">
          Account type
          <Tooltip text="Where you invest matters for taxes. Roth: pay taxes now, never again. Traditional 401k: defer taxes, pay later at withdrawal. At 22, Roth is almost always better — you're in your lowest tax bracket ever." />
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ id: 'roth', label: 'Roth IRA', note: 'Tax-free forever' }, { id: 'traditional', label: 'Traditional 401k', note: '~75% after taxes' }, { id: 'taxable', label: 'Taxable brokerage', note: '~85% after gains tax' }].map((opt) => (
            <button key={opt.id} onClick={() => setAccountType(opt.id)}
              className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all ${accountType === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
              <div className="leading-tight">{opt.label}</div>
              <div className={`text-xs mt-0.5 ${accountType === opt.id ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.note}</div>
            </button>
          ))}
        </div>
        {accountType === 'roth' && (
          <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            At 22 you're likely in your lowest tax bracket ever. Roth means you pay taxes <strong>now</strong> and <strong>never again</strong> — not on a single dollar of growth.
          </p>
        )}
        {accountType === 'traditional' && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Showing estimated after-tax value (×0.75). You'll owe income tax on every withdrawal in retirement — and may be in a higher bracket by then.
          </p>
        )}
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
            <button
              key={y}
              onClick={() => setHorizon(y)}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                horizon === y
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {y}yr
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <TimeChart data={chartData} />

      {/* Outcome cards */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">At age {22 + horizon}</p>
        <div className="grid grid-cols-1 gap-2">
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
                {fmtFull(surplus)}/mo {matchEnabled ? `+ ${fmtFull(Math.round(matchMonthly))} match` : ''} @ {Math.round(investRate * 100)}%
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-700">{fmt(scenarioB)}</p>
          </div>
        </div>
      </div>

      {/* Cost of waiting callout */}
      {horizon >= 10 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-orange-900">⏰ The cost of waiting 10 years</p>
          <p className="text-xs text-orange-700">
            If you wait until age 32 to start investing the same {fmtFull(surplus)}/mo:
          </p>
          <div className="flex gap-4 mt-1">
            <div>
              <p className="text-xs text-orange-600">Start at 22</p>
              <p className="text-base font-bold text-orange-800">{fmt(scenarioB)}</p>
            </div>
            <div className="text-orange-400 self-center">vs.</div>
            <div>
              <p className="text-xs text-orange-600">Start at 32</p>
              <p className="text-base font-bold text-orange-800">{fmt(lateStartValue)}</p>
            </div>
          </div>
          {scenarioB > lateStartValue && (
            <p className="text-xs font-semibold text-orange-800 mt-1">
              Starting 10 years earlier = {fmt(scenarioB - lateStartValue)} more at age {22 + horizon}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
