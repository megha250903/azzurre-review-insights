const TOPIC_ICONS = {
  cleanliness: '🧹', checkin: '🔑', staff: '👤', noise: '🔊',
  facilities: '🏊', location: '📍', room: '🛏️', value: '💰',
  breakfast: '🍳', wifi: '📶'
};

export default function ReviewCard({ review }) {
  const s = review.sentiment || 'neutral';

  const sentimentBadge = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral:  'bg-amber-50 text-amber-700 border-amber-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200'
  }[s];

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E4DC] hover:border-[#0284C7] transition-all rounded-2xl p-5 shadow-sm space-y-3">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FAF8F4] border border-[#E8E4DC] flex items-center justify-center text-xs font-bold text-slate-700">
            {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <span className="font-bold text-xs text-[#0F172A]">
              {review.reviewerName && review.reviewerName !== 'Anonymous' ? review.reviewerName : 'Verified Guest'}
            </span>
            {review.reviewerCountry && (
              <span className="text-slate-500 text-[11px] ml-1.5 font-medium">· {review.reviewerCountry}</span>
            )}
            {review.propertyName && (
              <span className="text-[11px] font-semibold text-[#0284C7] ml-2 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                {review.propertyName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${sentimentBadge}`}>
            {s === 'positive' ? '😊 Positive' : s === 'negative' ? '⚠️ Issue' : '😐 Neutral'}
          </span>
          <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
            {review.rating != null ? review.rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h4 className="text-xs font-bold text-slate-800 leading-snug">
          "{review.title}"
        </h4>
      )}

      {/* Pros & Cons */}
      <div className="space-y-1.5 text-xs">
        {review.pros && (
          <p className="text-slate-700 leading-relaxed bg-[#F0FDF4] border border-emerald-100 rounded-lg p-2.5">
            <span className="text-emerald-700 font-bold mr-1.5">+ Liked:</span>{review.pros}
          </p>
        )}
        {review.cons && (
          <p className="text-slate-700 leading-relaxed bg-[#FFF1F2] border border-rose-100 rounded-lg p-2.5">
            <span className="text-rose-700 font-bold mr-1.5">− Disliked:</span>{review.cons}
          </p>
        )}
        {!review.pros && !review.cons && review.fullText && (
          <p className="text-slate-700 leading-relaxed bg-[#FAF8F4] border border-[#E8E4DC] rounded-lg p-2.5">
            {review.fullText}
          </p>
        )}
      </div>

      {/* AI Summary */}
      {review.summary && review.summary !== 'AI unavailable.' && review.summary !== 'AI analysis unavailable.' && (
        <div className="bg-[#FAF8F4] border-l-2 border-[#0284C7] p-2.5 text-xs text-slate-700 rounded-r-lg">
          <strong className="text-[#0284C7] font-semibold">AI Operational Summary:</strong> {review.summary}
        </div>
      )}

      {/* Topics & Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4EFE6] text-[11px] text-slate-500">
        <div className="flex flex-wrap gap-1">
          {review.topics?.map((t) => (
            <span
              key={t}
              className="bg-[#F4EFE6] text-slate-700 border border-[#E8E4DC] px-2 py-0.5 rounded-md font-medium capitalize"
            >
              {TOPIC_ICONS[t] || '📌'} {t}
            </span>
          ))}
        </div>

        <div>
          {review.roomType && <span className="mr-2 text-slate-400">{review.roomType} · </span>}
          <span className="font-medium text-slate-600">
            {review.date ? new Date(review.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
