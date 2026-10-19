import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatTick = (value) => {
  if (typeof value !== 'number') return value;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return value;
};

/**
 * Universal grouped comparison bar chart for reporting periods.
 * Supports auto-detecting keys ('previous'/'current', 'Aug'/'Sep', etc.)
 * and dynamic period labels (e.g. 'Aug 2026' vs 'Sep 2026', 'Sep 2026' vs 'Oct 2026').
 */
export default function ComparisonBarChart({
  data,
  previousLabel,
  currentLabel,
  previousKey,
  currentKey,
  height = 300,
  previousColor = '#94a3b8',
  currentColor = '#2563eb',
}) {
  if (!data || !data.length) return null;

  const firstItem = data[0] || {};

  // Auto-detect keys if not explicitly passed
  let resolvedPrevKey = previousKey;
  let resolvedCurrKey = currentKey;

  if (!resolvedPrevKey || !resolvedCurrKey) {
    if ('previous' in firstItem && 'current' in firstItem) {
      resolvedPrevKey = 'previous';
      resolvedCurrKey = 'current';
    } else if ('Aug' in firstItem && 'Sep' in firstItem) {
      resolvedPrevKey = 'Aug';
      resolvedCurrKey = 'Sep';
    } else {
      const numericKeys = Object.keys(firstItem).filter((k) => k !== 'name');
      resolvedPrevKey = numericKeys[0] || 'previous';
      resolvedCurrKey = numericKeys[1] || 'current';
    }
  }

  const resolvedPrevLabel = previousLabel || (resolvedPrevKey === 'Aug' ? 'Aug 2026' : 'Previous Period');
  const resolvedCurrLabel = currentLabel || (resolvedCurrKey === 'Sep' ? 'Sep 2026' : 'Selected Period');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          interval={0}
          angle={data.length > 4 ? -20 : 0}
          textAnchor={data.length > 4 ? 'end' : 'middle'}
          height={data.length > 4 ? 50 : 24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatTick}
          width={44}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey={resolvedPrevKey}
          name={resolvedPrevLabel}
          fill={previousColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey={resolvedCurrKey}
          name={resolvedCurrLabel}
          fill={currentColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
