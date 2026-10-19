import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SectionCard({
  icon: Icon,
  iconClassName = 'bg-blue-50 text-blue-600',
  title,
  subtitle,
  actions,
  children,
  contentClassName,
  className,
}) {
  return (
    <Card className={cn('border border-slate-200/80 bg-white/50 backdrop-blur-xs shadow-xs mb-6', className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn('p-1.5 rounded-md', iconClassName)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className={cn('pt-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
