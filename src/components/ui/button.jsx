import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#14532D] text-white shadow-xs hover:bg-[#0E3B27]',
        destructive:
          'bg-[#D93636] text-white shadow-xs hover:bg-[#B91C1C]',
        outline:
          'border border-[#EEF0EC] bg-white text-[#111827] shadow-donezo hover:bg-[#F3F4F1] hover:border-[#E2E5DF]',
        secondary:
          'bg-[#E3F4EA] text-[#1B6B45] hover:bg-[#D1EBDC]',
        ghost: 'hover:bg-[#F3F4F1] text-[#6B7280] hover:text-[#111827]',
        link: 'text-[#14532D] underline-offset-4 hover:underline',
        success: 'bg-[#2E9B62] text-white shadow-xs hover:bg-[#1B6B45]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
