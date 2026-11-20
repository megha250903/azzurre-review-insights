import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function TrendChart({ data }) {
  if (!data?.length) return <p className="text-slate-400 text-xs">Awaiting historical trend data.</p>;

  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" />
        <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#64748B', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
          itemStyle={{ color: '#0284C7' }}
        />
        <ReferenceLine y={8} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Target: 8.0', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />
        <Line
          type="monotone"
          dataKey="avgRating"
          stroke="#0284C7"
          strokeWidth={2.5}
          dot={{ fill: '#0284C7', r: 3.5, strokeWidth: 1, stroke: '#FFFFFF' }}
          activeDot={{ r: 6 }}
          name="Avg Rating"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
