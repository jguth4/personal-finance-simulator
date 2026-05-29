import { useLocation } from 'react-router-dom';
import MarketSimulator from '../components/MarketSimulator';

export default function Simulation() {
  const { state } = useLocation();
  const initialSurplus = state?.budgetSurplus ?? 300;

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <MarketSimulator initialSurplus={initialSurplus} />
    </div>
  );
}
