import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { positive: '#10B981', neutral: '#F59E0B', negative: '#F43F5E' };

export default function SentimentDonut({ sentiment }) {
  const data = [
    { name: 'Positive', value: sentiment?.positive || 0 },
    { name: 'Neutral',  value: sentiment?.neutral  || 0 },
    { name: 'Negative', value: sentiment?.negative || 0 }
  ].filter((d) => d.value > 0);

  if (!data.length) return <p className="text-slate-400 text-xs">No sentiment distribution yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          itemStyle={{ color: '#0F172A', fontWeight: '600' }}
        />
        <Legend iconType="circle" wrapperStyle={{ color: '#64748B', fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
