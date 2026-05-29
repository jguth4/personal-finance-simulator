import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function fmtK(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-slate-700">Year {label} (age {22 + label})</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmtK(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function TimeChart({ data }) {
  const hasDebt = data.some((d) => d.payDebtFirst !== d.investNow);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">Wealth over time</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `${v}yr`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={fmtK}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => {
              const labels = {
                doNothing: 'Do nothing',
                payDebtFirst: 'Pay debt first',
                investNow: 'Invest now',
              };
              return labels[value] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="doNothing"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
            name="doNothing"
          />
          {hasDebt && (
            <Line
              type="monotone"
              dataKey="payDebtFirst"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="payDebtFirst"
              strokeDasharray="5 3"
            />
          )}
          <Line
            type="monotone"
            dataKey="investNow"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            name="investNow"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
