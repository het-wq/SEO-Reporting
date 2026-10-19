import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricBox({
  title,
  value,
  previousValue,
  diff,
  diffText,
  subtitle,
  invertColor = false,
  format = 'number',
}) {
  // If invertColor is true (e.g. for Rank position where a lower number is better)
  const isPositive = invertColor ? diff < 0 : diff > 0;
  const isNeutral = diff === 0 || diff === undefined || diff === null;

  const displayDiff = diffText || (diff !== undefined && diff !== null ? `${diff > 0 ? '+' : ''}${diff}%` : null);

  return (
    <div className="metric-box">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {displayDiff && (
          <span className={`metric-badge ${isNeutral ? 'neutral' : isPositive ? 'positive' : 'negative'}`}>
            {isNeutral ? (
              <Minus size={12} />
            ) : isPositive ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
            <span>{displayDiff}</span>
          </span>
        )}
      </div>

      <div className="metric-body">
        <div className="metric-value">{value}</div>
        {previousValue !== undefined && (
          <div className="metric-previous">
            Prev: <span className="prev-val">{previousValue}</span>
          </div>
        )}
      </div>

      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
}
