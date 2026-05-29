import { useState, useMemo } from 'react';

// Full question bank. showIf(answers) → false means skip this question.
const ALL_QUESTIONS = [
  // ── FOOD ──────────────────────────────────────────────────────────────
  {
    id: 'deliveryFreq', section: 'Food',
    q: 'How often do you order food delivery?',
    sub: 'DoorDash, Seamless, Uber Eats',
    options: [
      { value: 'never', label: 'Never', sub: 'I cook or eat out' },
      { value: 'low',   label: '1–2x per week', sub: '~$130–260/mo' },
      { value: 'mid',   label: '3–4x per week', sub: '~$390–500/mo' },
      { value: 'high',  label: '5+ times a week', sub: '~$600+/mo' },
    ],
  },
  {
    id: 'deliveryOrderCost', section: 'Food',
    showIf: (a) => a.deliveryFreq && a.deliveryFreq !== 'never',
    q: "What's a typical delivery order?",
    sub: 'Total including fees + tip. NYC fees add $8–12 per order.',
    options: [
      { value: 'cheap',     label: 'Fast food / quick bite', sub: '~$22 total' },
      { value: 'mid',       label: 'Regular restaurant meal', sub: '~$30 total' },
      { value: 'expensive', label: 'Full sit-down meal', sub: '~$47 total' },
    ],
  },
  {
    id: 'nightsOutFreq', section: 'Food',
    q: 'How many nights out per month?',
    sub: 'Restaurants, bars, clubs, events with drinks',
    options: [
      { value: 'low',   label: '1–2 nights/month', sub: '' },
      { value: 'mid',   label: '3–5 nights/month', sub: 'About once a week' },
      { value: 'high',  label: '6–10 nights/month', sub: 'Very active social life' },
      { value: 'vhigh', label: '10+ nights/month', sub: 'Out most nights' },
    ],
  },
  {
    id: 'nightsOutSpend', section: 'Food',
    q: 'On a typical night out, how much do you spend?',
    sub: 'Dinner, drinks, cover charges, late-night food',
    options: [
      { value: 'cheap', label: 'Under $30',    sub: 'Cheap eats, one or two drinks' },
      { value: 'mid',   label: '$30–70',        sub: 'Dinner + a few drinks' },
      { value: 'high',  label: '$70–150',       sub: 'Nice dinner, bar hopping' },
      { value: 'vhigh', label: '$150+',         sub: 'Clubs, bottle service, fancy spots' },
    ],
  },
  {
    id: 'lunch', section: 'Food',
    q: 'At work, what do you do for lunch?',
    sub: 'NYC lunch spots average $14–18',
    options: [
      { value: 'bring', label: 'Bring lunch / eat at home', sub: '~$20/mo' },
      { value: 'mix',   label: 'Mix — bring some, buy some', sub: '~$120/mo' },
      { value: 'buy',   label: 'Buy lunch most days', sub: '~$260/mo' },
    ],
  },

  // ── GETTING AROUND ────────────────────────────────────────────────────
  {
    id: 'nightTransport', section: 'Getting Around',
    q: 'When you go out at night, how do you get home?',
    sub: 'Avg NYC Uber ~$20 per trip',
    options: [
      { value: 'subway',       label: 'Subway both ways', sub: 'Covered by MetroCard' },
      { value: 'uberOneWay',   label: 'Uber one way (subway the other)', sub: '+~$20 per night out' },
      { value: 'uberBothWays', label: 'Uber both ways',  sub: '+~$40 per night out' },
    ],
  },
  {
    id: 'dayUber', section: 'Getting Around',
    q: 'How often do you take Uber/Lyft during the day?',
    sub: 'Instead of the subway',
    options: [
      { value: 'never',     label: 'Rarely / never',        sub: 'Subway all the way' },
      { value: 'sometimes', label: 'A few times per month', sub: '+~$20/mo' },
      { value: 'often',     label: 'A few times per week',  sub: '+~$65/mo' },
      { value: 'daily',     label: 'Most days',             sub: '+~$200/mo' },
    ],
  },

  // ── SUBSCRIPTIONS & SHOPPING ──────────────────────────────────────────
  {
    id: 'subscriptions', section: 'Subscriptions & Shopping',
    q: 'Which of these do you subscribe to?',
    sub: 'Select all that apply',
    multi: true,
    options: [
      { value: 'netflix',  label: 'Netflix',              sub: '$15.49/mo' },
      { value: 'spotify',  label: 'Spotify / Apple Music', sub: '$10.99/mo' },
      { value: 'apple',    label: 'Apple One / iCloud',   sub: '$16.95/mo' },
      { value: 'hulu',     label: 'Hulu / Disney+',       sub: '$17.99/mo' },
      { value: 'youtube',  label: 'YouTube Premium',      sub: '$13.99/mo' },
      { value: 'prime',    label: 'Amazon Prime',         sub: '$14.99/mo' },
      { value: 'news',     label: 'News (NYT, WSJ...)',   sub: '$17/mo' },
      { value: 'adobe',    label: 'Adobe Creative Cloud', sub: '$54.99/mo' },
      { value: 'gaming',    label: 'Gaming (Xbox/PS Plus)',        sub: '$14.99/mo' },
      { value: 'fitness',   label: 'Fitness app (Peloton, Mirror)', sub: '$12.99/mo' },
      { value: 'sports',    label: 'Sports (ESPN+, NBA, NFL)',      sub: '$25/mo' },
      { value: 'classpass', label: 'Fitness classes (ClassPass)',   sub: '$79/mo' },
      { value: 'mealkit',   label: 'Meal kit (HelloFresh)',         sub: '$75/mo' },
    ],
  },
  {
    id: 'clothingFreq', section: 'Subscriptions & Shopping',
    q: 'How often do you buy clothes, shoes, or accessories?',
    sub: '',
    options: [
      { value: 'rarely',  label: 'Rarely — a few times a year', sub: '' },
      { value: 'monthly', label: 'About once a month',          sub: '' },
      { value: 'weekly',  label: 'Every week or so',            sub: '' },
    ],
  },
  {
    id: 'clothingHaul', section: 'Subscriptions & Shopping',
    showIf: (a) => a.clothingFreq && a.clothingFreq !== 'rarely',
    q: "When you shop for clothes, what's a typical spend?",
    sub: '',
    options: [
      { value: 'small',  label: 'Under $50',   sub: 'A few basics' },
      { value: 'medium', label: '$50–150',      sub: 'A couple items' },
      { value: 'large',  label: '$150–500',     sub: 'A real haul' },
      { value: 'xlarge', label: '$500+',        sub: 'Full wardrobe refresh' },
    ],
  },
  {
    id: 'onlineOrders', section: 'Subscriptions & Shopping',
    q: 'How often do you buy random stuff online?',
    sub: 'Amazon, TikTok Shop, impulse buys',
    options: [
      { value: 'never', label: 'Barely ever',         sub: '0–1 orders/mo' },
      { value: 'low',   label: '1–2 orders per month', sub: '' },
      { value: 'mid',   label: '3–5 orders per month', sub: '' },
      { value: 'high',  label: '5+ orders per month',  sub: 'You have a problem 😅' },
    ],
  },
  {
    id: 'onlineOrderCost', section: 'Subscriptions & Shopping',
    showIf: (a) => a.onlineOrders && a.onlineOrders !== 'never',
    q: "What's your typical order?",
    sub: '',
    options: [
      { value: 'cheap', label: 'Under $20',   sub: 'Small stuff, add-ons' },
      { value: 'mid',   label: '$20–50',      sub: 'Typical online order' },
      { value: 'high',  label: '$50–100',     sub: 'Bigger purchases' },
      { value: 'vhigh', label: '$100+',       sub: 'Electronics, furniture' },
    ],
  },
  {
    id: 'coffeeFreq', section: 'Subscriptions & Shopping',
    q: 'How often do you buy coffee or drinks from a cafe?',
    sub: 'NYC avg: $6.50/drink (latte, matcha, etc.)',
    options: [
      { value: 'never', label: 'Never / make it at home', sub: '$0/mo' },
      { value: 'low',   label: '1–2x per week',           sub: '~$56/mo' },
      { value: 'mid',   label: '3–5x per week',           sub: '~$113/mo' },
      { value: 'daily', label: 'Daily or more',           sub: '~$197/mo' },
    ],
  },

  // ── PERSONAL & LIFESTYLE ──────────────────────────────────────────────
  {
    id: 'beautyFreq', section: 'Personal & Lifestyle',
    q: 'How often do you get beauty or grooming services?',
    sub: 'Nails, hair color, lashes, skincare treatments, barbershop',
    options: [
      { value: 'rarely',   label: 'Rarely — a few times a year', sub: '' },
      { value: 'monthly',  label: 'About once a month',          sub: '' },
      { value: 'biweekly', label: 'Every 2 weeks',               sub: '' },
      { value: 'weekly',   label: 'Weekly',                      sub: '' },
    ],
  },
  {
    id: 'beautySpend', section: 'Personal & Lifestyle',
    showIf: (a) => a.beautyFreq && a.beautyFreq !== 'rarely',
    q: 'Typical spend per beauty / grooming visit?',
    sub: '',
    options: [
      { value: 'cheap', label: 'Under $30',   sub: 'Basic haircut, drugstore' },
      { value: 'mid',   label: '$30–80',      sub: 'Nails, regular cut/color' },
      { value: 'high',  label: '$80–200',     sub: 'Color, lash extensions' },
      { value: 'vhigh', label: '$200+',       sub: 'Full salon/spa treatment' },
    ],
  },
  {
    id: 'eventsPerMonth', section: 'Personal & Lifestyle',
    q: 'How many paid events do you go to per month?',
    sub: 'Concerts, sports games, comedy shows, clubs ($95 avg/event in NYC)',
    options: [
      { value: 'none', label: 'None — free stuff only', sub: '$0/mo' },
      { value: 'one',  label: '1 event per month',       sub: '~$95/mo' },
      { value: 'some', label: '2–3 events per month',    sub: '~$240/mo' },
      { value: 'many', label: '4+ events per month',     sub: '~$475+/mo' },
    ],
  },
  {
    id: 'tripsPerYear', section: 'Personal & Lifestyle',
    q: 'How many trips do you take per year — flights, hotels, Airbnb?',
    sub: 'Trips you pay for yourself',
    options: [
      { value: 'none', label: 'None — I stay local',       sub: '$0/mo' },
      { value: 'low',  label: '1–2 trips per year',        sub: '~$90–130/mo amortized' },
      { value: 'mid',  label: '3–4 trips per year',        sub: '~$220–350/mo amortized' },
      { value: 'high', label: '5+ trips per year',         sub: '~$375–925/mo amortized' },
    ],
  },
  {
    id: 'tripType', section: 'Personal & Lifestyle',
    showIf: (a) => a.tripsPerYear && a.tripsPerYear !== 'none',
    q: 'What kind of trips?',
    sub: '',
    options: [
      { value: 'domestic',      label: 'Weekend / road trips',     sub: '~$400/trip' },
      { value: 'city',          label: 'US cities (fly + hotel)',   sub: '~$750/trip' },
      { value: 'international', label: 'International (Europe, etc.)', sub: '~$1,850/trip' },
    ],
  },
  {
    id: 'gym', section: 'Personal & Lifestyle',
    q: "What's your fitness setup?",
    sub: '',
    options: [
      { value: 'nothing', label: 'Nothing — I work out free', sub: 'Running, parks, YouTube' },
      { value: 'budget',  label: 'Budget gym',               sub: 'Planet Fitness, YMCA: $10–25/mo' },
      { value: 'mid',     label: 'Mid-range gym',            sub: 'Blink, LA Fitness: $40–80/mo' },
      { value: 'premium', label: 'Premium gym or classes',   sub: 'Equinox, ClassPass: $150–350/mo' },
    ],
  },
];

function ProgressBar({ current, total }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-1.5">
      <div
        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.round((current / total) * 100)}%` }}
      />
    </div>
  );
}

function QuestionCard({ question, answers, onAnswer }) {
  const isMulti = question.multi;
  const current = answers[question.id] ?? (isMulti ? [] : null);

  function handleSelect(value) {
    if (isMulti) {
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onAnswer(question.id, next);
    } else {
      onAnswer(question.id, value);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{question.section}</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">{question.q}</h2>
        {question.sub && <p className="text-slate-500 text-sm mt-1">{question.sub}</p>}
      </div>

      <div className="space-y-2">
        {question.options.map((opt) => {
          const selected = isMulti ? current.includes(opt.value) : current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left border rounded-xl px-4 py-3 transition-all active:scale-[0.99] ${
                selected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{opt.label}</span>
                {opt.sub && (
                  <span className={`text-xs ml-3 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {opt.sub}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isMulti && (
        <p className="text-xs text-slate-400 text-center">Select all that apply — tap again to deselect</p>
      )}
    </div>
  );
}

export default function LifestyleInterview({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);

  // Filter to questions that are visible given current answers
  const visibleQuestions = useMemo(
    () => ALL_QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const currentQ = visibleQuestions[qIndex];
  const isMulti = currentQ?.multi;
  const currentAnswer = answers[currentQ?.id];
  const hasAnswer = isMulti
    ? Array.isArray(currentAnswer) // multi-select: can proceed even with 0 selected (no subs)
    : currentAnswer != null;

  function handleAnswer(id, value) {
    const updated = { ...answers, [id]: value };
    setAnswers(updated);

    if (!isMulti) {
      // Auto-advance on single select
      const nextVisible = ALL_QUESTIONS.filter((q) => !q.showIf || q.showIf(updated));
      const nextIdx = qIndex + 1;
      if (nextIdx >= nextVisible.length) {
        onComplete(updated);
      } else {
        setQIndex(nextIdx);
      }
    }
  }

  function handleNext() {
    const nextIdx = qIndex + 1;
    if (nextIdx >= visibleQuestions.length) {
      onComplete(answers);
    } else {
      setQIndex(nextIdx);
    }
  }

  function handleBack() {
    if (qIndex > 0) setQIndex(qIndex - 1);
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Question {qIndex + 1} of {visibleQuestions.length}</span>
          <span>{Math.round(((qIndex + 1) / visibleQuestions.length) * 100)}% done</span>
        </div>
        <ProgressBar current={qIndex + 1} total={visibleQuestions.length} />
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQ}
        answers={answers}
        onAnswer={handleAnswer}
      />

      {/* Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleBack}
          disabled={qIndex === 0}
          className="text-slate-400 text-sm hover:text-slate-600 disabled:opacity-30"
        >
          ← Back
        </button>

        {isMulti && (
          <button
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {qIndex === visibleQuestions.length - 1 ? 'See my results →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
