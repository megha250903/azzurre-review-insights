import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

export default function CategoryRadar({ scores }) {
  if (!scores) return <p className="text-slate-500 text-sm">No category data yet.</p>;

  const data = [
    { category: 'Cleanliness',  value: scores.cleanliness   || 0 },
    { category: 'Comfort',      value: scores.comfort        || 0 },
    { category: 'Location',     value: scores.location       || 0 },
    { category: 'Facilities',   value: scores.facilities     || 0 },
    { category: 'Staff',        value: scores.staff          || 0 },
    { category: 'Value',        value: scores.valueForMoney  || 0 },
    { category: 'WiFi',         value: scores.freeWifi       || 0 }
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 9 }} />
        <Radar name="Score" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          itemStyle={{ color: '#38bdf8' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
