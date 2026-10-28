import React, { useState, useId } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const formatTick = (value) => {
  if (typeof value !== 'number') return value;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return value;
};

// Map any blue or purple shades to Donezo green palette
const isDisallowedColor = (color) => {
  if (!color || typeof color !== 'string') return false;
  const lower = color.toLowerCase();
  return (
    lower.includes('blue') ||
    lower.includes('sky') ||
    lower.includes('purple') ||
    lower.includes('violet') ||
    lower.includes('indigo') ||
    [
      '#2563eb', '#0ea5e9', '#3b82f6', '#0284c7', '#3ba7f5', '#1d4ed8', '#60a5fa', '#93c5fd', '#38bdf8',
      '#7c3aed', '#8b5cf6', '#6366f1', '#4f46e5', '#a855f7', '#9333ea', '#c084fc', '#d946ef',
    ].includes(lower)
  );
};

/**
 * Universal comparison chart for reporting periods.
 * Defaults to smooth Area Graph with green gradient fill and circular dots (like reference design),
 * and provides seamless toggle between Graph and clean simple Bar view.
 */
export default function ComparisonBarChart({
  data,
  previousLabel,
  currentLabel,
  previousKey,
  currentKey,
  height = 290,
  previousColor = '#CBD5E1',
  currentColor = '#14532D',
  defaultView,
  showToggle = true,
}) {
  if (!data || !data.length) return null;

  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9-_]/g, '');

  // Default to graph for multi-point comparisons, bar for single-point
  const initialView = defaultView || (data.length > 1 ? 'graph' : 'bar');
  const [view, setView] = useState(initialView);

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

  // Ensure strict elimination of blue and purple: map to Donezo green
  const effectiveCurrentColor = isDisallowedColor(currentColor) ? '#14532D' : (currentColor || '#14532D');
  const effectivePreviousColor = isDisallowedColor(previousColor) ? '#CBD5E1' : (previousColor || '#CBD5E1');

  return (
    <div className="w-full">
      {/* View Switcher: Graph vs Bar */}
      {showToggle && data.length > 1 && (
        <div className="flex justify-end mb-2">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100/80 border border-stone-200/60 text-[11px] font-medium text-stone-600">
            <button
              type="button"
              onClick={() => setView('graph')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                view === 'graph'
                  ? 'bg-white text-[#14532D] font-semibold shadow-2xs'
                  : 'hover:text-stone-900 cursor-pointer'
              }`}
              title="Graph View (Smooth line with dots & gradient)"
            >
              <TrendingUp className="h-3 w-3" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setView('bar')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${
                view === 'bar'
                  ? 'bg-white text-[#14532D] font-semibold shadow-2xs'
                  : 'hover:text-stone-900 cursor-pointer'
              }`}
              title="Bar View (Simple solid bars)"
            >
              <BarChart2 className="h-3 w-3" />
              <span>Bar</span>
            </button>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {view === 'graph' ? (
          <AreaChart
            data={data}
            margin={{ top: 16, right: 14, left: -10, bottom: 4 }}
          >
            <defs>
              <linearGradient id={`grad-curr-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={effectiveCurrentColor} stopOpacity={0.24} />
                <stop offset="60%" stopColor="#2E9B62" stopOpacity={0.06} />
                <stop offset="100%" stopColor={effectiveCurrentColor} stopOpacity={0.00} />
              </linearGradient>
              <linearGradient id={`grad-prev-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.00} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EC" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
              axisLine={{ stroke: '#EEF0EC' }}
              tickLine={false}
              interval={0}
              angle={data.length > 4 ? -20 : 0}
              textAnchor={data.length > 4 ? 'end' : 'middle'}
              height={data.length > 4 ? 50 : 26}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTick}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                borderRadius: 12,
                borderColor: '#EEF0EC',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                fontSize: 12,
                fontWeight: 500,
                color: '#111827',
                padding: '8px 12px',
              }}
              formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey={resolvedPrevKey}
              name={resolvedPrevLabel}
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill={`url(#grad-prev-${safeId})`}
              dot={{ r: 4, fill: '#94A3B8', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#64748B', stroke: '#FFFFFF', strokeWidth: 2.5 }}
            />
            <Area
              type="monotone"
              dataKey={resolvedCurrKey}
              name={resolvedCurrLabel}
              stroke={effectiveCurrentColor}
              strokeWidth={3}
              fill={`url(#grad-curr-${safeId})`}
              dot={{ r: 5, fill: effectiveCurrentColor, stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 7.5, fill: effectiveCurrentColor, stroke: '#FFFFFF', strokeWidth: 2.5 }}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 14, right: 10, left: -10, bottom: 4 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EC" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
              axisLine={{ stroke: '#EEF0EC' }}
              tickLine={false}
              interval={0}
              angle={data.length > 4 ? -20 : 0}
              textAnchor={data.length > 4 ? 'end' : 'middle'}
              height={data.length > 4 ? 50 : 26}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTick}
              width={44}
            />
            <Tooltip
              cursor={{ fill: '#F3F4F1', opacity: 0.5 }}
              contentStyle={{
                borderRadius: 12,
                borderColor: '#EEF0EC',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                fontSize: 12,
                fontWeight: 500,
                color: '#111827',
              }}
              formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }} />
            <Bar
              dataKey={resolvedPrevKey}
              name={resolvedPrevLabel}
              fill={effectivePreviousColor === '#94a3b8' ? '#CBD5E1' : effectivePreviousColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey={resolvedCurrKey}
              name={resolvedCurrLabel}
              fill={effectiveCurrentColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
