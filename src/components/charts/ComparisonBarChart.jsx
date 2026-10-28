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
  currentColor = '#14532D',
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

  // If currentColor was the legacy blue '#2563eb', modernize to Donezo primary green '#14532D'
  const effectiveCurrentColor = currentColor === '#2563eb' ? '#14532D' : currentColor;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <pattern
            id="diagonalHatch"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="2" />
          </pattern>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EC" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={data.length > 4 ? -20 : 0}
          textAnchor={data.length > 4 ? 'end' : 'middle'}
          height={data.length > 4 ? 50 : 28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatTick}
          width={44}
        />
        <Tooltip
          cursor={{ fill: '#F3F4F1', opacity: 0.6 }}
          contentStyle={{
            borderRadius: 14,
            borderColor: '#EEF0EC',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            fontSize: 12,
            fontWeight: 500,
            color: '#111827',
          }}
          formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#6B7280', paddingTop: 8 }} />
        <Bar
          dataKey={resolvedPrevKey}
          name={resolvedPrevLabel}
          fill="url(#diagonalHatch)"
          stroke="#94A3B8"
          strokeWidth={1}
          radius={[12, 12, 12, 12]}
          maxBarSize={38}
        />
        <Bar
          dataKey={resolvedCurrKey}
          name={resolvedCurrLabel}
          fill={effectiveCurrentColor}
          radius={[12, 12, 12, 12]}
          maxBarSize={38}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
