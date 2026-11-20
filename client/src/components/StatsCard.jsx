export default function StatsCard({ label, value, sub, delta, icon, color = 'blue' }) {
  const isPositiveDelta = delta !== null && delta !== undefined && delta > 0;
  const isNegativeDelta = delta !== null && delta !== undefined && delta < 0;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <span className="text-2xl p-2 rounded-xl bg-[#FAF8F4] border border-[#E8E4DC] shadow-inner">{icon}</span>
        {delta !== null && delta !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            isPositiveDelta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            isNegativeDelta ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {isPositiveDelta ? '▲ +' : isNegativeDelta ? '▼ ' : '— '}{delta} pts
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-[#0F172A] mt-3 tracking-tight">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
