export default function ExecutiveAlerts({ compare, allData }) {
  const droppingProps = (compare || []).filter(p => p.ratingDelta !== null && p.ratingDelta < 0);
  const topNegTopics = (allData?.topics || [])
    .filter(t => t.negative > 0)
    .sort((a, b) => b.negPct - a.negPct);

  return (
    <div className="bg-[#FFFFFF] border border-[#FDE68A] rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Decorative accent strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-[#0284C7]" />

      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Azzurro Hotels · Operations Priority Alert & Action Directives
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Urgent Alerts */}
        <div className="space-y-3">
          {droppingProps.map(p => (
            <div key={p.key} className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                <span>⚠️ {p.name}</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{p.ratingDelta} pts WoW</span>
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                Guest rating dropped from last week's {p.prevWeek?.avgRating?.toFixed(1) || '—'} to {p.thisWeek?.avgRating?.toFixed(1) || '—'}. Operations supervisor audit scheduled.
              </p>
            </div>
          ))}

          {topNegTopics.slice(0, 1).map(t => (
            <div key={t.topic} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs">
              <span className="font-bold text-[#0F172A] uppercase tracking-wide">
                📌 Key Driver of Negative Feedback: {t.topic}
              </span>
              <p className="text-slate-600 mt-1 leading-relaxed">
                {t.negPct}% of guest complaints across the portfolio reference <strong>{t.topic}</strong>. Review contractor maintenance frequency.
              </p>
            </div>
          ))}
        </div>

        {/* Action Directives */}
        <div className="bg-[#F4EFE6]/60 border border-[#E8E4DC] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#0284C7] uppercase tracking-wider mb-2.5">
              📋 Property Management Directives (Sydney GM)
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
              <li><strong className="text-[#0F172A]">Olympic Hotel Paddington:</strong> Audit Moore Park Rd window seals; reinforce noise curfew on event nights.</li>
              <li><strong className="text-[#0F172A]">Potts Point & Central:</strong> Enforce 10 PM quiet pod policy; inspect morning shower queue flow.</li>
              <li><strong className="text-[#0F172A]">Darling Harbour:</strong> Check bathroom drainage speed on 3rd floor and maintain ICC visitor luggage staging.</li>
            </ul>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E8E4DC] flex justify-between items-center text-[11px] text-slate-500">
            <span>Portfolio Status: 2 Active Action Items</span>
            <span className="text-emerald-700 font-semibold">AI Topic Analyzed via Groq</span>
          </div>
        </div>
      </div>
    </div>
  );
}
