import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import LoadingBar from '../components/LoadingBar';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Compare() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/analytics/compare/all`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBar text="Comparing Azzurro property performance metrics..." />;

  const barData = data.map((p) => ({
    name: p.name?.replace('Azzurro Pod Hotel ', '').replace('Olympic Hotel ', '') || p.key,
    'Avg Rating': parseFloat((p.avgRating || 0).toFixed(2)),
    '% Positive': p.sentiment
      ? Math.round((p.sentiment.positive / (p.sentiment.positive + p.sentiment.neutral + p.sentiment.negative || 1)) * 100)
      : 0
  }));

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E8E4DC] shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
          Azzurro Hotels · Sydney Portfolio Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Side-by-side performance benchmarking across all 4 Sydney properties
        </p>
      </div>

      <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E8E4DC] shadow-sm">
        <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-6">
          Average Guest Rating & Satisfaction Benchmark
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#64748B', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend wrapperStyle={{ color: '#64748B', fontSize: 12 }} />
            <Bar dataKey="Avg Rating" fill="#0284C7" radius={[6, 6, 0, 0]} />
            <Bar dataKey="% Positive" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E8E4DC] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E8E4DC]">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Operational Health Scorecard
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FAF8F4] text-slate-600 font-bold border-b border-[#E8E4DC]">
              <tr>
                <th className="text-left px-5 py-3.5 uppercase tracking-wide">Property</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">Overall Rating</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">Total Reviews</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">This Week</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">Last Week</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">WoW Delta</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">Positive</th>
                <th className="px-5 py-3.5 text-center uppercase tracking-wide">Negative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFE6]">
              {data.map((p) => (
                <tr key={p.key} className="hover:bg-[#FAF8F4] transition-colors">
                  <td className="px-5 py-4 font-bold text-[#0F172A]">{p.name}</td>
                  <td className="px-5 py-4 text-center font-bold text-sky-800 text-sm">{(p.avgRating || 0).toFixed(1)}</td>
                  <td className="px-5 py-4 text-slate-600 text-center font-medium">{p.total || 0}</td>
                  <td className="px-5 py-4 text-slate-800 text-center font-semibold">{p.thisWeek?.avgRating ? p.thisWeek.avgRating.toFixed(1) : '—'}</td>
                  <td className="px-5 py-4 text-slate-600 text-center">{p.prevWeek?.avgRating ? p.prevWeek.avgRating.toFixed(1) : '—'}</td>
                  <td className="px-5 py-4 text-center">
                    {p.ratingDelta !== null && p.ratingDelta !== undefined ? (
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                        p.ratingDelta > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        p.ratingDelta < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {p.ratingDelta > 0 ? '▲ +' : p.ratingDelta < 0 ? '▼ ' : '— '}{p.ratingDelta}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-emerald-700 font-bold text-center">{p.sentiment?.positive || 0}</td>
                  <td className="px-5 py-4 text-rose-700 font-bold text-center">{p.sentiment?.negative || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
