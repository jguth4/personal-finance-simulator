import { useState } from 'react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        aria-label="More info"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs font-bold leading-none flex items-center justify-center hover:bg-slate-300 focus:outline-none"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </span>
  );
}
