export function RiskGauge({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  let label = "Low";
  let color = "from-green-500 to-green-600";
  if (clamped >= 40) {
    label = "High";
    color = "from-red-500 to-red-600";
  } else if (clamped >= 25) {
    label = "Medium";
    color = "from-amber-500 to-amber-600";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${color}`}
          style={{
            backgroundImage: `conic-gradient(var(--tw-gradient-from), var(--tw-gradient-to) ${clamped}%, #e2e8f0 ${clamped}%)`,
          }}
        >
          <div className="absolute inset-1 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-800">
            {clamped}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500">Risk score</span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </div>
    </div>
  );
}
