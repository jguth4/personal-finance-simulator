import { useState } from 'react';
import { NEIGHBORHOODS, LIVING_SITUATIONS, AMENITIES } from '../data/neighborhoods';

const STEPS = ['situation', 'neighborhood', 'amenities'];

export default function HousingInterview({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    livingSituation: null,
    neighborhood: null,
    amenities: [],
  });

  function selectSituation(id) {
    const updated = { ...answers, livingSituation: id };
    setAnswers(updated);
    setStep(1);
  }

  function selectNeighborhood(id) {
    const updated = { ...answers, neighborhood: id };
    setAnswers(updated);
    setStep(2);
  }

  function toggleAmenity(id) {
    setAnswers((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Housing — Question {step + 1} of 3</p>
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 1: Living situation */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Where do you live?</h2>
            <p className="text-slate-500 text-sm mt-1">Most NYC 22-year-olds start with roommates. What's your situation?</p>
          </div>
          <div className="space-y-2">
            {LIVING_SITUATIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSituation(s.id)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-[0.99]"
              >
                <p className="font-semibold text-slate-900">{s.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Neighborhood */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Which neighborhood?</h2>
            <p className="text-slate-500 text-sm mt-1">Rent varies a lot by location. Source: StreetEasy Market Report Q1 2025.</p>
          </div>
          <div className="space-y-2">
            {NEIGHBORHOODS.map((n) => {
              const price = n.rent[answers.livingSituation] ?? n.rent.studio;
              return (
                <button
                  key={n.id}
                  onClick={() => selectNeighborhood(n.id)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-900 pr-4">{n.name}</p>
                    <p className="text-indigo-700 font-bold whitespace-nowrap">${price.toLocaleString()}/mo</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.description}</p>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(0)} className="text-slate-400 text-sm hover:text-slate-600">← Back</button>
        </div>
      )}

      {/* Step 3: Amenities */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Any must-have amenities?</h2>
            <p className="text-slate-500 text-sm mt-1">These add a premium to your rent. Select all that apply.</p>
          </div>
          <div className="space-y-2">
            {AMENITIES.map((a) => {
              const selected = answers.amenities.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAmenity(a.id)}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    selected
                      ? 'bg-indigo-50 border-indigo-400'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{a.label}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-amber-600">+${a.monthlyCost}/mo</p>
                      <div className={`w-5 h-5 rounded border-2 mt-1 ml-auto flex items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => toggleAmenity('none')}
              className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all"
            >
              <p className="font-semibold text-slate-900">None — basics only</p>
              <p className="text-sm text-slate-500 mt-0.5">No premium amenities, lowest rent for my situation</p>
            </button>
          </div>

          <button
            onClick={() => onComplete(answers)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-base transition-colors"
          >
            Next: Your lifestyle →
          </button>
          <button onClick={() => setStep(1)} className="text-slate-400 text-sm hover:text-slate-600">← Back</button>
        </div>
      )}
    </div>
  );
}
