import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceChart({ history, currency }) {
  const data = history.map(h => ({
    date: new Date(h.scraped_at).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
    precio: parseFloat(h.price),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="date" tick={{ fill: '#aaa', fontSize: 11 }} />
        <YAxis tick={{ fill: '#aaa', fontSize: 11 }} tickFormatter={v => `${currency} ${v.toLocaleString()}`} width={90} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
          labelStyle={{ color: '#aaa' }}
          formatter={v => [`${currency} ${v.toLocaleString()}`, 'Precio']}
        />
        <Line type="monotone" dataKey="precio" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
