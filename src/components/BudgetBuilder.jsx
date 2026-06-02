import { CATEGORIES } from '../data/categories';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';
import Tooltip from './Tooltip';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function Remaining({ remaining }) {
  const pct = Math.round((remaining / TAKE_HOME_MONTHLY) * 100);
  const isOver = remaining < 0;
  const isWarning = remaining >= 0 && remaining < 200;

  const barColor = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-700';
  const bgColor = isOver ? 'bg-red-50 border-red-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  const barWidth = isOver ? 100 : Math.max(0, Math.min(100, pct));

  return (
    <div className={`sticky top-0 z-10 border-b px-4 py-3 ${bgColor}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-600">Monthly budget</span>
          <span className={`font-bold text-lg ${textColor}`}>
            {isOver ? `Over by ${fmt(Math.abs(remaining))}` : `${fmt(remaining)} left`}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
          <span>$0</span>
          <span>{fmt(TAKE_HOME_MONTHLY)} take-home</span>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ category, selectedTier, onChange }) {
  const activeTier = category.tiers[selectedTier];
  return (
    <div className="px-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center mb-2">
        <span className="font-medium text-slate-800 text-sm">{category.name}</span>
        <Tooltip text={category.tooltip} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {category.tiers.map((tier, i) => {
          const selected = selectedTier === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(category.id, i)}
              className={`rounded-lg px-2 py-2 text-left transition-all border ${
                selected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100'
              }`}
            >
              <div className={`text-xs font-semibold mb-0.5 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {tier.label}
              </div>
              <div className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-800'}`}>
                {fmt(tier.amount)}
              </div>
              <div className={`text-xs leading-tight mt-0.5 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {tier.description}
              </div>
            </button>
          );
        })}
      </div>
      {activeTier?.happinessNote && (
        <p className="text-xs text-slate-400 italic mt-1.5 px-0.5">{activeTier.happinessNote}</p>
      )}
    </div>
  );
}

export default function BudgetBuilder({ selections, onChange, onFinish }) {
  const totalSpent = CATEGORIES.reduce(
    (sum, cat) => sum + cat.tiers[selections[cat.id]].amount,
    0
  );
  const remaining = TAKE_HOME_MONTHLY - totalSpent;

  return (
    <div className="max-w-2xl mx-auto">
      <Remaining remaining={remaining} />

      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-slate-900">Build your monthly budget</h2>
        <p className="text-slate-500 text-sm mt-1">
          Tap each option to choose your lifestyle. Watch the bar at the top.
        </p>
      </div>

      <div className="bg-white">
        {CATEGORIES.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            selectedTier={selections[cat.id]}
            onChange={onChange}
          />
        ))}
      </div>

      <div className="px-4 py-6">
        <button
          onClick={onFinish}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl text-base transition-colors"
        >
          See my results →
        </button>
      </div>
    </div>
  );
}
