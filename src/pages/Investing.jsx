import { useNavigate, useLocation } from 'react-router-dom';
import InvestingFlow from '../components/InvestingFlow';

export default function Investing() {
  const navigate = useNavigate();
  const location = useLocation();
  const budgetSurplus = location.state?.budgetSurplus ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
          ←
        </button>
        <div>
          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Grade 11</p>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Compound Interest & Investing</h1>
        </div>
      </header>
      <InvestingFlow budgetSurplus={budgetSurplus} />
    </div>
  );
}
