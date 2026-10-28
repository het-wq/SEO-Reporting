import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SectionCard({
  icon: Icon,
  iconClassName = 'bg-[#E3F4EA] text-[#1B6B45]',
  title,
  subtitle,
  actions,
  children,
  contentClassName,
  className,
}) {
  return (
    <Card className={cn('border border-[#EEF0EC] bg-white rounded-[24px] shadow-donezo mb-6 overflow-hidden', className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 p-6 pb-4 border-b border-[#F3F4F1]">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn('p-2 rounded-xl flex items-center justify-center shrink-0', iconClassName)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#111827] tracking-tight">{title}</CardTitle>
            {subtitle && <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </CardHeader>
      <CardContent className={cn('p-6 pt-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
