import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Slide-over panel, hand-rolled to match this project's existing dialog.jsx
// pattern (no Radix dependency).
const Sheet = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {children}
    </div>
  );
};

const SheetContent = React.forwardRef(({ className, children, onClose, side = 'left', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'fixed inset-y-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl animate-in slide-in-from-left',
      side === 'left' ? 'left-0' : 'right-0',
      className
    )}
    {...props}
  >
    {children}
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-sm p-1 text-slate-500 opacity-70 transition-opacity hover:bg-slate-100 hover:opacity-100 focus:outline-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    )}
  </div>
));
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetContent };
