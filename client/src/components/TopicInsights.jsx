const TOPIC_LABELS = {
  cleanliness: { label: 'Cleanliness',       icon: '🧹' },
  checkin:     { label: 'Check-in Experience', icon: '🔑' },
  staff:       { label: 'Staff & Reception',   icon: '👤' },
  noise:       { label: 'Noise & Quietness',   icon: '🔊' },
  facilities:  { label: 'Facilities & Showers',icon: '🏊' },
  location:    { label: 'Location & Transit',  icon: '📍' },
  room:        { label: 'Room & Pod Comfort',  icon: '🛏️' },
  value:       { label: 'Value for Money',     icon: '💰' },
  breakfast:   { label: 'Breakfast & Dining',  icon: '🍳' },
  wifi:        { label: 'WiFi & Connectivity', icon: '📶' }
};

export default function TopicInsights({ topics, totalReviews }) {
  if (!topics?.length) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">🏷️ Operational Topics</h3>
        <p className="text-slate-400 text-xs">Run AI analysis to generate topic insights.</p>
      </div>
    );
  }

  const sorted = [...topics].sort((a, b) => b.negative - a.negative);

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
          🏷️ Operational Insights & Defect Breakdown
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">
          Prioritized by issue frequency
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Percentage of guest reviews highlighting positive praise vs operational pain points
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((t) => {
          const meta = TOPIC_LABELS[t.topic] || { label: t.topic, icon: '📌' };
          const isHighIssue = t.negPct >= 15;

          return (
            <div key={t.topic} className="bg-[#FAF8F4] border border-[#E8E4DC] rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{meta.icon}</span> {meta.label}
                </span>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    {t.negative} neg ({t.negPct}%)
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {t.positive} pos ({t.posPct}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className="bg-rose-500 h-full rounded-l-full transition-all"
                  style={{ width: `${Math.min(t.negPct, 100)}%` }}
                />
                <div
                  className="bg-emerald-500 h-full rounded-r-full transition-all"
                  style={{ width: `${Math.min(t.posPct, 100)}%` }}
                />
              </div>

              {isHighIssue && (
                <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                  ⚠️ <strong>{t.negPct}%</strong> of negative reviews cite {meta.label.toLowerCase()} issues.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
