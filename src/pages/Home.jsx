import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-3">💰</div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Personal Finance<br />Simulator</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Real numbers. Real NYC. Your choices.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <button
          onClick={() => navigate('/budget')}
          className="w-full bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 active:bg-indigo-100 rounded-2xl p-5 text-left transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-0.5">Grade 10</p>
              <h2 className="text-lg font-bold text-slate-900">Budgeting</h2>
              <p className="text-slate-500 text-sm mt-1">
                You just got a $72,500 job in NYC. Can you make it work?
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/investing')}
          className="w-full bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 active:bg-purple-100 rounded-2xl p-5 text-left transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">📈</div>
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-0.5">Grade 11</p>
              <h2 className="text-lg font-bold text-slate-900">Compound Interest</h2>
              <p className="text-slate-500 text-sm mt-1">
                Debt, investing, and the power of starting early.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/simulation')}
          className="w-full bg-white border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 rounded-2xl p-5 text-left transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">⏱</div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">Market Simulator</p>
              <h2 className="text-lg font-bold text-slate-900">20 Years of Real Markets</h2>
              <p className="text-slate-500 text-sm mt-1">
                Real historical data. Real crashes. Will you hold through them?
              </p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center max-w-xs">
        NYC 2026 tax rates · Real expense ranges · No accounts needed
      </p>
    </div>
  );
}
