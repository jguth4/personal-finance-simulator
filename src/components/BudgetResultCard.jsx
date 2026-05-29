import { CATEGORIES } from '../data/categories';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#fb923c', '#94a3b8', '#e879f9', '#2dd4bf',
  '#f472b6', '#a3e635', '#38bdf8',
];

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function BudgetResultCard({ selections, onReset, onInvesting }) {
  const items = CATEGORIES.map((cat, i) => ({
    name: cat.name,
    value: cat.tiers[selections[cat.id]].amount,
    color: COLORS[i % COLORS.length],
  })).filter((item) => item.value > 0);

  const totalSpent = items.reduce((s, i) => s + i.value, 0);
  const surplus = TAKE_HOME_MONTHLY - totalSpent;
  const isOver = surplus < 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Monthly Budget</h2>
        <p className="text-slate-500 text-sm mt-1">Screenshot this to share with your class</p>
      </div>

      {/* Summary bar */}
      <div className={`rounded-xl p-4 border ${isOver ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Take-home</p>
            <p className="font-bold text-slate-800">{fmt(TAKE_HOME_MONTHLY)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Spent</p>
            <p className="font-bold text-slate-800">{fmt(totalSpent)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">{isOver ? 'Shortfall' : 'Surplus'}</p>
            <p className={`font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
              {isOver ? '−' : '+'}{fmt(Math.abs(surplus))}
            </p>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              paddingAngle={2}
            >
              {items.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <ReTooltip
              formatter={(value) => [fmt(value), '']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Line items */}
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-800">{fmt(item.value)}</span>
              <span className="text-xs text-slate-400 ml-1">
                {Math.round((item.value / TAKE_HOME_MONTHLY) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Category selection labels */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your choices</p>
        {CATEGORIES.map((cat) => {
          const tier = cat.tiers[selections[cat.id]];
          const labels = ['Budget', 'Standard', 'Splurge'];
          const colors = ['text-emerald-600', 'text-amber-600', 'text-red-500'];
          return (
            <div key={cat.id} className="flex justify-between text-xs">
              <span className="text-slate-600">{cat.name}</span>
              <span className={`font-medium ${colors[selections[cat.id]]}`}>{labels[selections[cat.id]]}</span>
            </div>
          );
        })}
      </div>

      {!isOver && surplus > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
          <p className="text-indigo-800 text-sm font-medium">
            You have <span className="font-bold">{fmt(surplus)}/mo</span> left over.
          </p>
          <p className="text-indigo-600 text-xs mt-0.5">
            One more lesson — then we'll show you what investing it does.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
        >
          Start over
        </button>
        <button
          onClick={() => onInvesting(surplus)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
