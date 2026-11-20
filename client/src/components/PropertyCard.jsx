import { Link } from 'react-router-dom';

const ratingColor = (r) => {
  if (r >= 8.0) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (r >= 6.5) return 'text-sky-700 bg-sky-50 border-sky-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

export default function PropertyCard({ propertyKey, name, location, avgRating, total, sentiment, delta, thisWeekAvg, prevWeekAvg }) {
  const t = (sentiment?.positive || 0) + (sentiment?.neutral || 0) + (sentiment?.negative || 0) || 1;
  const posPct = Math.round(((sentiment?.positive || 0) / t) * 100);
  const neuPct = Math.round(((sentiment?.neutral || 0) / t) * 100);
  const negPct = Math.round(((sentiment?.negative || 0) / t) * 100);

  return (
    <Link to={`/property/${propertyKey}`} className="group block h-full">
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] hover:border-[#0284C7] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm group-hover:text-[#0284C7] transition-colors">
                {name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{location || 'Sydney, NSW'}</p>
            </div>
            <span className={`text-xl font-bold px-2.5 py-1 rounded-xl border ${ratingColor(avgRating)}`}>
              {avgRating ? avgRating.toFixed(1) : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 mb-3">
            <span>{total || 0} real reviews</span>
            {delta !== null && delta !== undefined && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                delta > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                delta < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '— '}{delta} pts WoW
              </span>
            )}
          </div>
        </div>

        {/* Sentiment breakdown bar */}
        <div className="pt-3 border-t border-[#F4EFE6]">
          <div className="flex justify-between text-[11px] text-slate-600 mb-1.5">
            <span className="font-medium">Guest Sentiment</span>
            <span className="text-emerald-700 font-bold">{posPct}% positive</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100">
            <div className="bg-emerald-500 transition-all" style={{ width: `${posPct}%` }} title={`Positive: ${posPct}%`} />
            <div className="bg-amber-400 transition-all"   style={{ width: `${neuPct}%` }} title={`Neutral: ${neuPct}%`} />
            <div className="bg-rose-500 transition-all"    style={{ width: `${negPct}%` }} title={`Negative: ${negPct}%`} />
          </div>
        </div>
      </div>
    </Link>
  );
}
