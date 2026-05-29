import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HousingInterview from '../components/HousingInterview';
import LifestyleInterview from '../components/LifestyleInterview';
import BudgetReveal from '../components/BudgetReveal';
import BudgetBuilder from '../components/BudgetBuilder';
import BudgetResultCard from '../components/BudgetResultCard';
import LifestyleInflation from '../components/LifestyleInflation';
import { generateBudget, mapToSelections } from '../utils/generateBudget';
import { CATEGORIES, DEFAULT_SELECTIONS } from '../data/categories';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';

const STEPS = {
  HOUSING:   'housing',
  INTERVIEW: 'interview',
  REVEAL:    'reveal',
  SANDBOX:   'sandbox',
  RESULT:    'result',
  LIFESTYLE: 'lifestyle',
};

const STEP_KEYS = [
  STEPS.HOUSING, STEPS.INTERVIEW, STEPS.REVEAL,
  STEPS.SANDBOX, STEPS.RESULT, STEPS.LIFESTYLE,
];

function computeSurplus(selections) {
  const totalSpent = CATEGORIES.reduce(
    (sum, cat) => sum + cat.tiers[selections[cat.id]].amount,
    0
  );
  return Math.max(0, TAKE_HOME_MONTHLY - totalSpent);
}

export default function Budget() {
  const [step, setStep] = useState(STEPS.HOUSING);
  const [housingAnswers,   setHousingAnswers]   = useState(null);
  const [interviewAnswers, setInterviewAnswers] = useState(null);
  const [generatedBudget,  setGeneratedBudget]  = useState(null);
  const [selections,       setSelections]       = useState({ ...DEFAULT_SELECTIONS });
  const navigate = useNavigate();

  function handleHousingComplete(answers) {
    setHousingAnswers(answers);
    setStep(STEPS.INTERVIEW);
  }

  function handleInterviewComplete(answers) {
    setInterviewAnswers(answers);
    const budget = generateBudget(housingAnswers, answers);
    setGeneratedBudget(budget);
    setSelections(mapToSelections(budget, CATEGORIES));
    setStep(STEPS.REVEAL);
  }

  function handleChange(categoryId, tierIndex) {
    setSelections((prev) => ({ ...prev, [categoryId]: tierIndex }));
  }

  function handleReset() {
    setSelections({ ...DEFAULT_SELECTIONS });
    setStep(STEPS.HOUSING);
    setHousingAnswers(null);
    setInterviewAnswers(null);
    setGeneratedBudget(null);
  }

  const currentStepIdx = STEP_KEYS.indexOf(step);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => {
            if (step === STEPS.HOUSING) navigate('/');
            else {
              const prev = STEP_KEYS[currentStepIdx - 1];
              if (prev) setStep(prev);
            }
          }}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
        >
          ←
        </button>
        <div>
          <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Grade 10</p>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Budgeting</h1>
        </div>
        <div className="ml-auto flex gap-1">
          {STEP_KEYS.map((s, i) => {
            const active = step === s;
            const done = i < currentStepIdx;
            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${active ? 'bg-indigo-600' : done ? 'bg-indigo-300' : 'bg-slate-200'}`}
              />
            );
          })}
        </div>
      </header>

      {step === STEPS.HOUSING && (
        <HousingInterview onComplete={handleHousingComplete} />
      )}

      {step === STEPS.INTERVIEW && (
        <LifestyleInterview onComplete={handleInterviewComplete} />
      )}

      {step === STEPS.REVEAL && generatedBudget && (
        <BudgetReveal
          budget={generatedBudget}
          onAdjust={() => setStep(STEPS.SANDBOX)}
          onContinue={() => setStep(STEPS.RESULT)}
        />
      )}

      {step === STEPS.SANDBOX && (
        <BudgetBuilder
          selections={selections}
          onChange={handleChange}
          onFinish={() => setStep(STEPS.RESULT)}
        />
      )}

      {step === STEPS.RESULT && (
        <BudgetResultCard
          selections={selections}
          onReset={handleReset}
          onInvesting={() => setStep(STEPS.LIFESTYLE)}
        />
      )}

      {step === STEPS.LIFESTYLE && (
        <LifestyleInflation
          budgetSurplus={computeSurplus(selections)}
          onFinish={() => navigate('/investing', { state: { budgetSurplus: computeSurplus(selections) } })}
        />
      )}
    </div>
  );
}
