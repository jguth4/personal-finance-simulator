import { useState } from 'react';
import { NEIGHBORHOODS, LIVING_SITUATIONS, AMENITIES, computeRent } from '../data/neighborhoods';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';

const STEPS = ['situation', 'neighborhood', 'amenities'];

export default function HousingInterview({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    livingSituation: null,
    neighborhood: null,
    amenities: [],
  });

  function selectSituation(id) {
    setAnswers({ ...answers, livingSituation: id });
    setStep(1);
  }

  function selectNeighborhood(id) {
    setAnswers({ ...answers, neighborhood: id });
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

  // Fix A: "None" clears all amenities instead of appending 'none'
  function clearAmenities() {
    setAnswers((prev) => ({ ...prev, amenities: [] }));
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  // Live rent calculation for amenities step
  const currentRent = answers.neighborhood && answers.livingSituation
    ? computeRent(answers.neighborhood, answers.livingSituation, answers.amenities)
    : null;
  const rentPct = currentRent ? Math.round((currentRent / TAKE_HOME_MONTHLY) * 100) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Housing — Question {step + 1} of 3</p>
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Fix B: income anchor on every step */}
        <p className="text-xs text-slate-400 mt-2 text-right">
          Your take-home after taxes: <span className="font-semibold text-slate-600">${TAKE_HOME_MONTHLY.toLocaleString()}/mo</span>
        </p>
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
              const pct = Math.round((price / TAKE_HOME_MONTHLY) * 100);
              const pctColor = pct > 40 ? 'text-red-600' : pct > 30 ? 'text-amber-600' : 'text-emerald-600';
              return (
                <button
                  key={n.id}
                  onClick={() => selectNeighborhood(n.id)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-900 pr-4">{n.name}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-indigo-700 font-bold">${price.toLocaleString()}/mo</p>
                      <p className={`text-xs font-medium ${pctColor}`}>{pct}% of take-home</p>
                    </div>
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
            <p className="text-slate-500 text-sm mt-1">Select all that apply. Some save money, some cost more.</p>
          </div>
          <div className="space-y-2">
            {AMENITIES.map((a) => {
              const selected = answers.amenities.includes(a.id);
              const costLabel = a.monthlyCost < 0
                ? `-$${Math.abs(a.monthlyCost)}/mo`
                : `+$${a.monthlyCost}/mo`;
              const costColor = a.monthlyCost < 0 ? 'text-emerald-600' : 'text-amber-600';
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
                      <p className={`text-sm font-semibold ${costColor}`}>{costLabel}</p>
                      <div className={`w-5 h-5 rounded border-2 mt-1 ml-auto flex items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {/* Fix A: None button clears amenities instead of appending 'none' */}
            <button
              onClick={clearAmenities}
              className={`w-full text-left border rounded-xl p-4 transition-all ${
                answers.amenities.length === 0
                  ? 'bg-indigo-50 border-indigo-400'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <p className="font-semibold text-slate-900">None — basics only</p>
              <p className="text-sm text-slate-500 mt-0.5">No premium amenities, lowest rent for my situation</p>
            </button>
          </div>

          {/* Fix C: Housing cost summary before proceeding */}
          {currentRent !== null && (
            <div className={`rounded-xl p-4 border ${
              rentPct > 40 ? 'bg-red-50 border-red-200' :
              rentPct > 30 ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">Your estimated rent</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rentPct > 40
                      ? 'Housing experts recommend keeping rent under 30% of take-home.'
                      : rentPct > 30
                      ? 'Getting close to the 30% guideline. Watch the rest of your budget.'
                      : "Under 30% — leaves room for savings and life."}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-slate-900">${currentRent.toLocaleString()}/mo</p>
                  <p className={`text-sm font-semibold ${rentPct > 40 ? 'text-red-600' : rentPct > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {rentPct}% of take-home
                  </p>
                </div>
              </div>
            </div>
          )}

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
