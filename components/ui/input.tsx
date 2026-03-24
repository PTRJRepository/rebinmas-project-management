'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Use 'text' as default type when type is undefined to prevent hydration error
    const inputType = type || 'text';

    return (
      <input
        type={inputType}
        className={cn(
          'flex h-10 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 transition-colors',
          'placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
