import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import TrendChart from '../components/TrendChart';
import SentimentDonut from '../components/SentimentDonut';
import ReviewCard from '../components/ReviewCard';
import WeekOverWeek from '../components/WeekOverWeek';
import TopicInsights from '../components/TopicInsights';
import StatsCard from '../components/StatsCard';
import LoadingBar from '../components/LoadingBar';

const API = import.meta.env.VITE_API_URL || '/api';

export default function PropertyDetail() {
  const { propertyKey } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews]     = useState([]);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading]     = useState(true);

  // Filters
  const [sentiment, setSentiment] = useState('');
  const [topic, setTopic]         = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/analytics/${propertyKey}`)
      .then((r) => setAnalytics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [propertyKey]);

  const fetchReviews = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 12 });
    if (sentiment) params.append('sentiment', sentiment);
    if (topic)     params.append('topic', topic);
    if (dateFrom)  params.append('dateFrom', dateFrom);
    if (dateTo)    params.append('dateTo', dateTo);

    axios.get(`${API}/reviews/${propertyKey}?${params}`)
      .then((r) => {
        setReviews(r.data.reviews || []);
        setTotalPages(r.data.pages || 1);
        setTotalReviews(r.data.total || 0);
      })
      .catch(console.error);
  }, [propertyKey, page, sentiment, topic, dateFrom, dateTo]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  if (loading) return <LoadingBar text="Loading Azzurro property analytics..." />;
  if (!analytics) return <div className="text-rose-600 p-8 text-center font-bold">Property not found.</div>;

  const TOPICS = ['cleanliness', 'checkin', 'staff', 'noise', 'facilities', 'location', 'room', 'value', 'breakfast', 'wifi'];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-xs font-semibold text-[#0284C7] hover:underline mb-2 inline-block">
            ← Back to Portfolio Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{analytics.propertyName}</h1>
            <span className="text-xs bg-sky-50 text-[#0284C7] font-bold px-3 py-1 rounded-full border border-sky-100">
              Azzurro Sydney
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{analytics.location || 'Sydney, NSW'}</p>
        </div>

        <div className="text-right bg-[#FAF8F4] border border-[#E8E4DC] p-4 rounded-2xl">
          <div className="text-3xl sm:text-4xl font-bold text-sky-800">
            {analytics.overall?.avgRating?.toFixed(1) || '—'}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">{analytics.overall?.total || 0} total reviews</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="⭐" label="Overall Rating" value={analytics.overall?.avgRating?.toFixed(1)} sub="All-time average" />
        <StatsCard
          icon="📅" label="Current Week Score"
          value={analytics.weekOverWeek?.thisWeek?.avgRating ? analytics.weekOverWeek.thisWeek.avgRating.toFixed(1) : '—'}
          delta={analytics.weekOverWeek?.ratingDelta}
          sub="Week-over-week variance"
        />
        <StatsCard icon="😊" label="Positive Reviews" value={analytics.sentiment?.positive || 0} sub="Guest praise" />
        <StatsCard icon="⚠️" label="Operational Issues" value={analytics.sentiment?.negative || 0} sub="Flagged items" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WeekOverWeek
          thisWeek={analytics.weekOverWeek?.thisWeek}
          prevWeek={analytics.weekOverWeek?.prevWeek}
          ratingDelta={analytics.weekOverWeek?.ratingDelta}
        />
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] shadow-sm">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Sentiment Distribution</h3>
          <SentimentDonut sentiment={analytics.sentiment} />
        </div>
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] shadow-sm">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">12-Month Rating Trend</h3>
          <TrendChart data={analytics.trend} />
        </div>
      </div>

      {/* Topic insights */}
      {analytics.topics?.length > 0 && (
        <TopicInsights topics={analytics.topics} totalReviews={analytics.overall?.total} />
      )}

      {/* Review feed */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E8E4DC] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-5 items-center justify-between">
          <h3 className="text-base font-bold text-[#0F172A]">
            Guest Reviews & Operational Feedback ({totalReviews})
          </h3>

          <div className="flex flex-wrap gap-2">
            <select
              className="bg-[#FAF8F4] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 font-medium"
              value={sentiment}
              onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
            >
              <option value="">All Sentiments</option>
              <option value="positive">😊 Positive</option>
              <option value="neutral">😐 Neutral</option>
              <option value="negative">🚨 Negative</option>
            </select>

            <select
              className="bg-[#FAF8F4] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 font-medium"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPage(1); }}
            >
              <option value="">All Topics</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <input
              type="date"
              className="bg-[#FAF8F4] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 font-medium"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
            <input
              type="date"
              className="bg-[#FAF8F4] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 font-medium"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />

            {(sentiment || topic || dateFrom || dateTo) && (
              <button
                className="text-xs font-semibold text-[#0284C7] hover:underline self-center ml-2"
                onClick={() => { setSentiment(''); setTopic(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((r) => <ReviewCard key={r._id || r.reviewHash} review={r} />)}
          {!reviews.length && (
            <div className="text-center py-12 text-slate-500 bg-[#FAF8F4] rounded-2xl border border-[#E8E4DC]">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-xs font-medium">No reviews found matching the current filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 mt-6 justify-center items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 bg-[#FAF8F4] border border-[#E8E4DC] text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-[#F4EFE6]"
            >
              ← Prev
            </button>
            <span className="text-slate-600 text-xs font-medium px-2">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-[#FAF8F4] border border-[#E8E4DC] text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-[#F4EFE6]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
