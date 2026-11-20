import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StatsCard from '../components/StatsCard';
import WeekOverWeek from '../components/WeekOverWeek';
import TrendChart from '../components/TrendChart';
import SentimentDonut from '../components/SentimentDonut';
import TopicInsights from '../components/TopicInsights';
import TopicMatrix from '../components/TopicMatrix';
import ExecutiveAlerts from '../components/ExecutiveAlerts';
import ReviewCard from '../components/ReviewCard';
import LoadingBar from '../components/LoadingBar';

const API = import.meta.env.VITE_API_URL || '/api';

const PROPERTIES = [
  { key: 'central-sydney', name: 'Azzurro Pod Central Sydney',  loc: 'Surry Hills, Sydney', icon: '🏨' },
  { key: 'darling-harbour',name: 'Azzurro Pod Darling Harbour', loc: 'Pyrmont / CBD',       icon: '🏨' },
  { key: 'potts-point',    name: 'Azzurro Pod Potts Point',     loc: 'Victoria St / Kings Cross', icon: '🏨' },
  { key: 'paddington',     name: 'Olympic Hotel Paddington',    loc: 'Moore Park Road',     icon: '🏨' }
];

export default function Dashboard() {
  const [compare, setCompare]         = useState([]);
  const [allData, setAllData]         = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [scraping, setScraping]       = useState(false);
  const [loading, setLoading]         = useState(true);

  // Pagination: 20 reviews per page for clean, responsive UI
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filters for Live Feed
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedTopic, setSelectedTopic]         = useState('');
  const [searchQuery, setSearchQuery]             = useState('');

  const loadData = useCallback(() => {
    Promise.all([
      axios.get(`${API}/analytics/compare/all`).then((r) => r.data),
      axios.get(`${API}/analytics/all`).then((r) => r.data)
    ])
      .then(([comp, all]) => { setCompare(comp); setAllData(all); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadReviews = useCallback(() => {
    const params = new URLSearchParams({ page: 1, limit: 300 });
    if (selectedSentiment) params.append('sentiment', selectedSentiment);
    if (selectedTopic)     params.append('topic', selectedTopic);

    axios.get(`${API}/reviews/${selectedProperty}?${params}`)
      .then((r) => {
        let list = r.data.reviews || [];
        setTotalReviewsCount(r.data.total || list.length);
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(rev =>
            (rev.title && rev.title.toLowerCase().includes(q)) ||
            (rev.fullText && rev.fullText.toLowerCase().includes(q)) ||
            (rev.reviewerName && rev.reviewerName.toLowerCase().includes(q))
          );
        }
        setReviews(list);
      })
      .catch(console.error);
  }, [selectedProperty, selectedSentiment, selectedTopic, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProperty, selectedSentiment, selectedTopic, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedReviews = reviews.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    const el = document.getElementById('review-feed-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await axios.post(`${API}/scraper/run`);
      alert('Live Booking.com scraper dispatched! Check server terminal for page-by-page progress.');
      loadData();
      loadReviews();
    } catch (e) {
      alert(`Scraper error: ${e.message}`);
    } finally {
      setTimeout(() => setScraping(false), 3000);
    }
  };

  const handleExportCSV = () => {
    if (!reviews.length) return alert('No reviews to export.');
    const headers = ['Property', 'Reviewer', 'Rating', 'Sentiment', 'Topics', 'Date', 'Title', 'Review Text'];
    const rows = reviews.map(r => [
      `"${r.propertyName || r.propertyKey}"`,
      `"${r.reviewerName || 'Anonymous'}"`,
      r.rating || '',
      r.sentiment || '',
      `"${(r.topics || []).join(', ')}"`,
      r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.fullText || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `azzurro_live_reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingBar text="Loading Azzurro Operations Intelligence..." />;
  }

  const totals = compare.reduce(
    (acc, p) => ({
      reviews:  acc.reviews  + (p.total      || 0),
      positive: acc.positive + (p.sentiment?.positive || 0),
      negative: acc.negative + (p.sentiment?.negative || 0)
    }),
    { reviews: 0, positive: 0, negative: 0 }
  );

  const avgRating =
    compare.length
      ? (compare.reduce((s, p) => s + (p.avgRating || 0), 0) / compare.length).toFixed(1)
      : '—';

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Hero / Brand Banner */}
      <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-[#E0F2FE] text-[#0369A1] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Azzurro Hotels Sydney
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Free dinner · Cozy pods · Operations Insights
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Booking.com Guest Review Insights Dashboard
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Real-time sentiment monitoring, week-over-week performance tracking, and automated operational issue classification across 4 Sydney properties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#FAF8F4] hover:bg-[#F4EFE6] border border-[#E8E4DC] text-slate-700 text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            📥 Export Report (CSV)
          </button>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-sky-200"
          >
            {scraping ? '⏳ Scraping Booking.com…' : '🔄 Run Scraper Now'}
          </button>
        </div>
      </div>

      {/* Priority Operational Alerts */}
      <ExecutiveAlerts compare={compare} allData={allData} />

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon="⭐" label="Portfolio Avg Score" value={avgRating} sub="Average across all 4 properties" />
        <StatsCard icon="📝" label="Live Reviews Collected" value={totals.reviews.toLocaleString()} sub="Verified Booking.com guests" />
        <StatsCard icon="😊" label="Positive Feedback" value={totals.positive} sub={`${Math.round((totals.positive / (totals.reviews || 1)) * 100)}% guest satisfaction`} />
        <StatsCard icon="⚠️" label="Operational Issues Flagged" value={totals.negative} sub={`${Math.round((totals.negative / (totals.reviews || 1)) * 100)}% requiring GM attention`} />
      </div>

      {/* Properties Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-wide uppercase">
              🏨 Properties Overview
            </h2>
            <p className="text-xs text-slate-500">Live property scores and weekly performance shifts</p>
          </div>
          <span className="text-xs text-slate-400">Week-over-Week delta tracked</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROPERTIES.map((prop) => {
            const data = compare.find((c) => c.key === prop.key);
            return (
              <Link key={prop.key} to={`/property/${prop.key}`}>
                <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] hover:border-[#0284C7] shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-[#0F172A] text-sm group-hover:text-[#0284C7] transition-colors">
                          {prop.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{prop.loc}</p>
                      </div>
                      <span className="text-xl font-bold px-2.5 py-1 rounded-xl border text-sky-800 bg-sky-50 border-sky-200">
                        {data?.avgRating ? data.avgRating.toFixed(1) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 mb-3">
                      <span>{data?.total || 0} reviews</span>
                      {data?.ratingDelta !== null && data?.ratingDelta !== undefined && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          data.ratingDelta > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          data.ratingDelta < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {data.ratingDelta > 0 ? '▲ +' : data.ratingDelta < 0 ? '▼ ' : '— '}{data.ratingDelta} pts WoW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sentiment Bar */}
                  {data?.sentiment && (() => {
                    const t = (data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative) || 1;
                    const posPct = Math.round((data.sentiment.positive / t) * 100);
                    return (
                      <div className="pt-3 border-t border-[#F4EFE6]">
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                          <span className="font-medium">Satisfaction</span>
                          <span className="text-emerald-700 font-bold">{posPct}% pos</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-slate-100">
                          <div className="bg-emerald-500" style={{ width: `${(data.sentiment.positive/t)*100}%` }} />
                          <div className="bg-amber-400"   style={{ width: `${(data.sentiment.neutral/t)*100}%` }} />
                          <div className="bg-rose-500"    style={{ width: `${(data.sentiment.negative/t)*100}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 8 Core Operational Topic Matrix */}
      <TopicMatrix allData={allData} />

      {/* Week-over-Week + Charts Grid */}
      {allData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WeekOverWeek
            thisWeek={allData.weekOverWeek?.thisWeek}
            prevWeek={allData.weekOverWeek?.prevWeek}
            ratingDelta={allData.weekOverWeek?.ratingDelta}
          />
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] shadow-sm">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Overall Sentiment Breakdown</h3>
            <SentimentDonut sentiment={allData.sentiment} />
          </div>
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8E4DC] shadow-sm">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">12-Month Rating Trend</h3>
            <TrendChart data={allData.trend} />
          </div>
        </div>
      )}

      {/* Operational Defect Breakdown */}
      {allData?.topics?.length > 0 && (
        <TopicInsights topics={allData.topics} totalReviews={allData.overall?.total} />
      )}

      {/* Live Review Feed with Instant Filters */}
      <div id="review-feed-section" className="bg-[#FFFFFF] rounded-3xl border border-[#E8E4DC] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">
              🔍 Live Operations Review Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse, filter, and inspect real Booking.com guest reviews across all 4 properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-[#FAF8F4] border border-[#E8E4DC] px-3.5 py-1.5 rounded-full shadow-xs">
              Showing {reviews.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, reviews.length)} of {reviews.length} reviews
            </span>
            {totalPages > 1 && (
              <span className="text-xs font-semibold text-[#0284C7] bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-full">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-[#FAF8F4] rounded-2xl border border-[#E8E4DC]">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full bg-[#FFFFFF] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0284C7] font-medium"
            >
              <option value="all">All 4 Properties</option>
              <option value="central-sydney">Azzurro Pod Central Sydney</option>
              <option value="darling-harbour">Azzurro Pod Darling Harbour</option>
              <option value="potts-point">Azzurro Pod Potts Point</option>
              <option value="paddington">Olympic Hotel Paddington</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sentiment</label>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="w-full bg-[#FFFFFF] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0284C7] font-medium"
            >
              <option value="">All Sentiments</option>
              <option value="negative">🚨 Negative Only (Issues)</option>
              <option value="positive">😊 Positive Only</option>
              <option value="neutral">😐 Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Operational Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-[#FFFFFF] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0284C7] font-medium"
            >
              <option value="">All 8 Operational Topics</option>
              <option value="cleanliness">🧹 Cleanliness</option>
              <option value="checkin">🔑 Check-in</option>
              <option value="staff">👤 Staff</option>
              <option value="noise">🔊 Noise</option>
              <option value="facilities">🏊 Facilities</option>
              <option value="location">📍 Location</option>
              <option value="room">🛏️ Room condition</option>
              <option value="value">💰 Value for money</option>
              <option value="wifi">📶 WiFi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Keyword Search</label>
            <input
              type="text"
              placeholder="e.g. bed, shower, loud, adrian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] text-slate-800 text-xs border border-[#E8E4DC] rounded-xl px-3 py-2 focus:outline-none focus:border-[#0284C7]"
            />
          </div>
        </div>

        {/* Reviews List (20 items per page) */}
        <div className="space-y-3">
          {displayedReviews.map((r) => (
            <ReviewCard key={r._id || r.reviewHash} review={r} />
          ))}

          {!reviews.length && (
            <div className="text-center py-12 text-slate-500 bg-[#FAF8F4] rounded-2xl border border-[#E8E4DC]">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm font-semibold text-slate-700">No reviews found matching your filter criteria.</p>
              <button
                onClick={() => { setSelectedProperty('all'); setSelectedSentiment(''); setSelectedTopic(''); setSearchQuery(''); }}
                className="mt-2 text-xs text-[#0284C7] font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Clean Modern Pagination Bar (after 20 reviews) */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-[#E8E4DC] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Showing reviews <span className="font-bold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(startIndex + PAGE_SIZE, reviews.length)}</span> of{' '}
              <span className="font-bold text-slate-800">{reviews.length}</span> (20 per page)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  currentPage === 1
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-[#E8E4DC] hover:border-[#0284C7] hover:text-[#0284C7] shadow-xs'
                }`}
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((num, idx) =>
                  num === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 select-none">
                      •••
                    </span>
                  ) : (
                    <button
                      key={`page-${num}`}
                      onClick={() => goToPage(num)}
                      className={`min-w-[32px] h-8 text-xs font-bold rounded-xl border transition-all ${
                        currentPage === num
                          ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs scale-105'
                          : 'bg-white text-slate-700 border-[#E8E4DC] hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  currentPage === totalPages
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-[#E8E4DC] hover:border-[#0284C7] hover:text-[#0284C7] shadow-xs'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
