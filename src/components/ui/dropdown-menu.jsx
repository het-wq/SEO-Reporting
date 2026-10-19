import * as React from 'react';
import { cn } from '@/lib/utils';

// Minimal hand-rolled dropdown menu (no Radix), consistent with the rest of
// this project's dependency-free UI primitives.
const DropdownMenuContext = React.createContext(null);

function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={ref}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

const DropdownMenuTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuContext);
  const onClick = (e) => {
    props.onClick?.(e);
    ctx?.setOpen((o) => !o);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick, ref });
  }
  return (
    <button type="button" ref={ref} onClick={onClick} {...props}>
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

function DropdownMenuContent({ className, align = 'end', children }) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx?.open) return null;

  const alignClass = align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <div
      className={cn(
        'absolute z-50 mt-1.5 min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95',
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ className, onSelect, children, ...props }) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer',
        className
      )}
      onClick={(e) => {
        onSelect?.(e);
        ctx?.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({ className }) {
  return <div className={cn('my-1 h-px bg-slate-100', className)} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
