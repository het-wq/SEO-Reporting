import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function MetricBox({
  title,
  value,
  previousValue,
  diff,
  diffText,
  subtitle,
  invertColor = false,
  className,
}) {
  // Validate diff to prevent NaN or Infinity
  const safeDiff =
    typeof diff === 'number' && !isNaN(diff) && isFinite(diff)
      ? Math.round(diff * 100) / 100
      : null;

  // When invertColor is true (e.g. Average Position), a lower number is better
  const isPositive = invertColor
    ? safeDiff !== null && safeDiff < 0
    : safeDiff !== null && safeDiff > 0;

  const isNeutral = safeDiff === 0 || safeDiff === null;

  // Format percentage change cleanly
  let displayDiff = null;
  if (diffText) {
    displayDiff = diffText;
  } else if (safeDiff !== null) {
    displayDiff = `${safeDiff > 0 ? '+' : ''}${safeDiff.toFixed(1)}%`;
  }

  // Format previous value display
  const hasPrevious = previousValue !== undefined && previousValue !== null && previousValue !== '';
  const displayPrevious = hasPrevious ? previousValue : 'Unavailable';

  return (
    <Card className={cn('hover:border-slate-300 transition-all shadow-xs', className)}>
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
          {displayDiff !== null ? (
            <Badge
              variant={isNeutral ? 'secondary' : isPositive ? 'success' : 'destructive'}
              className="font-medium text-[11px] px-1.5 py-0.5"
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                invertColor ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )
              ) : (
                invertColor ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )
              )}
              <span>{displayDiff}</span>
            </Badge>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal">No comparison</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value !== undefined && value !== null && value !== '' ? value : '—'}
          </div>
          <p className="text-xs text-slate-500">
            Previous: <span className="font-medium text-slate-700">{displayPrevious}</span>
          </p>
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
