import React from 'react';
import { Info } from 'lucide-react';

export default function EmptyState({ icon: Icon = Info, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
      <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
