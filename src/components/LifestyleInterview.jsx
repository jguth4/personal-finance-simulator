import { useState, useMemo } from 'react';

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
      { value: 'netflix',   label: 'Netflix',                      sub: '$15.49/mo' },
      { value: 'spotify',   label: 'Spotify / Apple Music',        sub: '$10.99/mo' },
      { value: 'apple',     label: 'Apple One / iCloud',           sub: '$16.95/mo' },
      { value: 'hulu',      label: 'Hulu / Disney+',               sub: '$17.99/mo' },
      { value: 'youtube',   label: 'YouTube Premium',              sub: '$13.99/mo' },
      { value: 'prime',     label: 'Amazon Prime',                 sub: '$14.99/mo' },
      { value: 'news',      label: 'News (NYT, WSJ...)',           sub: '$17/mo' },
      { value: 'adobe',     label: 'Adobe Creative Cloud',         sub: '$54.99/mo' },
      { value: 'gaming',    label: 'Gaming (Xbox/PS Plus)',         sub: '$14.99/mo' },
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
      { value: 'never', label: 'Barely ever',          sub: '0–1 orders/mo' },
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

// ── Section benchmark totals (BLS CEX 2023, NYC-adjusted, age 25–34) ──────
const SECTION_BENCHMARKS = {
  'Food':                       { total: 540,  note: 'delivery + dining out + lunch at work' },
  'Getting Around':             { total: 175,  note: 'MetroCard + occasional Ubers' },
  'Subscriptions & Shopping':   { total: 310,  note: 'subscriptions + clothing + online + coffee' },
  'Personal & Lifestyle':       { total: 370,  note: 'beauty, events, travel, gym' },
};

// ── Lightweight section total calculators ─────────────────────────────────
function calcFoodTotal(a) {
  const perWeek = { never: 0, low: 1.5, mid: 3.5, high: 5.5 };
  const costPerOrder = { cheap: 22, mid: 30, expensive: 47 };
  const delivery = Math.round((perWeek[a.deliveryFreq] ?? 0) * (costPerOrder[a.deliveryOrderCost] ?? 30) * 4.33);
  const nightsPerMonth = { low: 1.5, mid: 4, high: 8, vhigh: 12 };
  const perNight = { cheap: 25, mid: 50, high: 110, vhigh: 200 };
  const dining = Math.round((nightsPerMonth[a.nightsOutFreq] ?? 4) * (perNight[a.nightsOutSpend] ?? 50));
  const lunch = { bring: 20, mix: 120, buy: 260 }[a.lunch] ?? 120;
  return delivery + dining + lunch;
}

function calcTransitTotal(a) {
  const metroCard = 134;
  const nightsOut = { low: 1.5, mid: 4, high: 8, vhigh: 12 }[a.nightsOutFreq] ?? 4;
  const nightUber = { subway: 0, uberOneWay: 20, uberBothWays: 40 }[a.nightTransport] ?? 0;
  const dayExtra = { never: 0, sometimes: 20, often: 65, daily: 200 }[a.dayUber] ?? 0;
  return Math.round(metroCard + nightUber * nightsOut + dayExtra);
}

function calcShoppingTotal(a) {
  const prices = {
    netflix: 15.49, spotify: 10.99, apple: 16.95, hulu: 17.99,
    youtube: 13.99, prime: 14.99, news: 17.00, adobe: 54.99,
    gaming: 14.99, fitness: 12.99, sports: 25.00, classpass: 79.00, mealkit: 75.00,
  };
  const subs = Math.round((a.subscriptions ?? []).reduce((s, id) => s + (prices[id] ?? 0), 0));
  const timesPerMonth = { rarely: 0.2, monthly: 1, weekly: 4 };
  const avgHaul = { small: 35, medium: 100, large: 300, xlarge: 650 };
  const clothing = Math.round((timesPerMonth[a.clothingFreq] ?? 1) * (avgHaul[a.clothingHaul] ?? 100));
  const ordersPerMonth = { never: 0, low: 1.5, mid: 4, high: 6.5 };
  const avgOrder = { cheap: 15, mid: 35, high: 75, vhigh: 150 };
  const impulse = Math.round((ordersPerMonth[a.onlineOrders] ?? 1.5) * (avgOrder[a.onlineOrderCost] ?? 35));
  const coffeePerWeek = { never: 0, low: 1.5, mid: 4, daily: 7 };
  const coffee = Math.round((coffeePerWeek[a.coffeeFreq] ?? 0) * 6.5 * 4.33);
  return subs + clothing + impulse + coffee;
}

function calcLifestyleTotal(a) {
  const freqMap = { rarely: 0.25, monthly: 1, biweekly: 2, weekly: 4 };
  const visitCost = { cheap: 22, mid: 55, high: 140, vhigh: 280 };
  const beauty = Math.round((freqMap[a.beautyFreq] ?? 1) * (visitCost[a.beautySpend] ?? 55));
  const eventsMap = { none: 0, one: 1, some: 2.5, many: 5 };
  const events = Math.round((eventsMap[a.eventsPerMonth] ?? 1) * 95);
  const trips = { none: 0, low: 1.5, mid: 3.5, high: 6 }[a.tripsPerYear] ?? 1.5;
  const tripCost = { domestic: 400, city: 750, international: 1850 }[a.tripType] ?? 750;
  const travel = Math.round((trips * tripCost) / 12);
  const gym = { nothing: 0, budget: 18, mid: 60, premium: 250 }[a.gym] ?? 60;
  return beauty + events + travel + gym;
}

function getSectionTotal(section, answers) {
  if (section === 'Food') return calcFoodTotal(answers);
  if (section === 'Getting Around') return calcTransitTotal(answers);
  if (section === 'Subscriptions & Shopping') return calcShoppingTotal(answers);
  if (section === 'Personal & Lifestyle') return calcLifestyleTotal(answers);
  return 0;
}

// ── Section summary card ───────────────────────────────────────────────────
function SectionSummary({ section, answers, onContinue }) {
  const studentTotal = getSectionTotal(section, answers);
  const benchmark = SECTION_BENCHMARKS[section];
  const diff = studentTotal - benchmark.total;
  const over = diff > 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <div>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Section complete</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">{section}</h2>
      </div>

      <div className={`rounded-2xl p-5 border ${over ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-slate-600">Your choices</p>
            <p className="text-3xl font-bold text-slate-900">${studentTotal.toLocaleString()}/mo</p>
            <p className="text-xs text-slate-500 mt-1">{benchmark.note}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Typical for your age</p>
            <p className="text-xl font-semibold text-slate-700">${benchmark.total.toLocaleString()}/mo</p>
            <p className="text-xs text-slate-400 mt-1">BLS CEX 2023, NYC-adj.</p>
          </div>
        </div>

        {diff !== 0 && (
          <div className={`mt-3 pt-3 border-t ${over ? 'border-amber-200' : 'border-emerald-200'}`}>
            <p className={`text-sm font-semibold ${over ? 'text-amber-700' : 'text-emerald-700'}`}>
              {over
                ? `$${diff.toLocaleString()}/mo above typical — $${(diff * 12).toLocaleString()} per year`
                : `$${Math.abs(diff).toLocaleString()}/mo below typical — below-average spending here`}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-base transition-colors"
      >
        Continue →
      </button>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
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

// ── Question card ──────────────────────────────────────────────────────────
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

// ── Main component ─────────────────────────────────────────────────────────
export default function LifestyleInterview({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [summarySection, setSummarySection] = useState(null);
  const [pendingQIndex, setPendingQIndex] = useState(null);

  const visibleQuestions = useMemo(
    () => ALL_QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const currentQ = visibleQuestions[qIndex];
  const isMulti = currentQ?.multi;
  const currentAnswer = answers[currentQ?.id];

  function advanceOrSummary(updated, nextIdx, nextVisible) {
    if (nextIdx >= nextVisible.length) {
      onComplete(updated);
      return;
    }
    const nextSection = nextVisible[nextIdx].section;
    const curSection = nextVisible[qIndex]?.section ?? currentQ?.section;
    if (nextSection !== curSection) {
      setSummarySection(curSection);
      setPendingQIndex(nextIdx);
    } else {
      setQIndex(nextIdx);
    }
  }

  function handleAnswer(id, value) {
    const updated = { ...answers, [id]: value };
    setAnswers(updated);

    if (!isMulti) {
      const nextVisible = ALL_QUESTIONS.filter((q) => !q.showIf || q.showIf(updated));
      advanceOrSummary(updated, qIndex + 1, nextVisible);
    }
  }

  function handleNext() {
    const nextIdx = qIndex + 1;
    advanceOrSummary(answers, nextIdx, visibleQuestions);
  }

  function handleBack() {
    if (qIndex > 0) setQIndex(qIndex - 1);
  }

  function handleSummaryContinue() {
    setSummarySection(null);
    setQIndex(pendingQIndex);
    setPendingQIndex(null);
  }

  if (summarySection) {
    return (
      <SectionSummary
        section={summarySection}
        answers={answers}
        onContinue={handleSummaryContinue}
      />
    );
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Question {qIndex + 1} of {visibleQuestions.length}</span>
          <span>{Math.round(((qIndex + 1) / visibleQuestions.length) * 100)}% done</span>
        </div>
        <ProgressBar current={qIndex + 1} total={visibleQuestions.length} />
      </div>

      <QuestionCard question={currentQ} answers={answers} onAnswer={handleAnswer} />

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
