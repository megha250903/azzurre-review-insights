export default function WeekOverWeek({ thisWeek, prevWeek, ratingDelta }) {
  const delta = ratingDelta;
  const hasData = thisWeek?.count > 0 || prevWeek?.count > 0;

  if (!hasData) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">📅 Week over Week</h3>
        <p className="text-slate-400 text-xs">Awaiting additional weekly review periods.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4DC] p-5 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
          📅 Week-over-Week Rating Variance
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* This week */}
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] rounded-xl p-3 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Week</p>
            <p className="text-2xl font-bold text-[#0284C7]">
              {thisWeek?.avgRating ? thisWeek.avgRating.toFixed(1) : '—'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{thisWeek?.count || 0} reviews</p>
          </div>

          {/* Prev week */}
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] rounded-xl p-3 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Previous Week</p>
            <p className="text-2xl font-bold text-slate-700">
              {prevWeek?.avgRating ? prevWeek.avgRating.toFixed(1) : '—'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{prevWeek?.count || 0} reviews</p>
          </div>
        </div>
      </div>

      {/* Delta */}
      {delta !== null && (
        <div className={`mt-4 p-3 rounded-xl text-center border ${
          delta > 0 ? 'bg-emerald-50 border-emerald-200' :
          delta < 0 ? 'bg-rose-50 border-rose-200' :
                      'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-base font-bold ${
            delta > 0 ? 'text-emerald-700' :
            delta < 0 ? 'text-rose-700' : 'text-slate-700'
          }`}>
            {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '— '}{delta} pts
          </span>
          <p className="text-[11px] font-medium text-slate-600 mt-0.5">
            {delta > 0 ? 'Rating improved vs previous week 🎉' :
             delta < 0 ? 'Performance decline vs previous week ⚠️' : 'Performance steady'}
          </p>
        </div>
      )}
    </div>
  );
}
