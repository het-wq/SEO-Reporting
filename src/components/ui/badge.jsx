import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#14532D] text-white shadow-xs',
        secondary:
          'border-transparent bg-[#F3F4F6] text-[#6B7280]',
        destructive:
          'border-transparent bg-[#FDECEC] text-[#D93636]',
        outline: 'border-[#EEF0EC] text-[#111827] bg-white',
        success: 'border-transparent bg-[#E3F4EA] text-[#1B6B45]',
        info: 'border-transparent bg-[#E0F2FE] text-[#0284C7]',
        warning: 'border-transparent bg-[#FEF3C7] text-[#D97706]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
