const TOPICS = [
  { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
  { key: 'checkin',     label: 'Check-in',   icon: '🔑' },
  { key: 'staff',       label: 'Staff',       icon: '👤' },
  { key: 'noise',       label: 'Noise',       icon: '🔊' },
  { key: 'facilities',  label: 'Facilities',  icon: '🏊' },
  { key: 'location',    label: 'Location',    icon: '📍' },
  { key: 'room',        label: 'Room Condition', icon: '🛏️' },
  { key: 'value',       label: 'Value for Money', icon: '💰' }
];

export default function TopicMatrix({ allData }) {
  const topicsMap = {};
  (allData?.topics || []).forEach(t => {
    topicsMap[t.topic] = t;
  });

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
            Operational Topic Matrix · 8 Required Categories
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real guest review sentiment grouped by core operational focus areas
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 bg-[#FAF8F4] border border-[#E8E4DC] px-3 py-1 rounded-full">
          <span className="flex items-center gap-1.5 text-emerald-700">● Low Risk (&lt;10%)</span>
          <span className="flex items-center gap-1.5 text-amber-700">● Moderate (10-20%)</span>
          <span className="flex items-center gap-1.5 text-rose-700">● High Alert (&gt;20%)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {TOPICS.map(({ key, label, icon }) => {
          const t = topicsMap[key] || { total: 0, positive: 0, negative: 0, negPct: 0, posPct: 0 };
          const isHighRisk = t.negPct >= 20;
          const isModerate = t.negPct >= 10 && t.negPct < 20;

          return (
            <div
              key={key}
              className={`rounded-xl p-3.5 border transition-all text-center flex flex-col justify-between ${
                isHighRisk
                  ? 'bg-rose-50/70 border-rose-200 shadow-sm'
                  : isModerate
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-[#FAF8F4] border-[#E8E4DC] hover:border-[#0284C7]'
              }`}
            >
              <div>
                <div className="text-2xl mb-1.5">{icon}</div>
                <div className="text-[11px] font-semibold text-slate-800 truncate">{label}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <div className={`text-base font-bold ${
                  isHighRisk ? 'text-rose-700' : isModerate ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {t.negPct}% <span className="text-[10px] font-normal text-slate-500">neg</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {t.total} total
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
