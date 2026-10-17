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
  const isPositive = invertColor ? diff < 0 : diff > 0;
  const isNeutral = diff === 0 || diff === undefined || diff === null;

  const displayDiff = diffText || (diff !== undefined && diff !== null ? `${diff > 0 ? '+' : ''}${diff}%` : null);

  return (
    <Card className={cn('hover:border-slate-300 transition-all shadow-xs', className)}>
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
          {displayDiff && (
            <Badge
              variant={isNeutral ? 'secondary' : isPositive ? 'success' : 'destructive'}
              className="font-medium text-[11px] px-1.5 py-0.5"
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{displayDiff}</span>
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</div>
          {previousValue !== undefined && (
            <p className="text-xs text-slate-500">
              Previous: <span className="font-medium text-slate-700">{previousValue}</span>
            </p>
          )}
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
