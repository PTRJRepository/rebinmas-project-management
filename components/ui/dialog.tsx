'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
                {children}
            </div>
        </div>
    );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left px-6 py-4', className)}
        {...props}
    />
);

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
);

const DialogContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('px-6 py-4', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4', className)}
        {...props}
    />
);

const DialogClose = ({ onClick }: { onClick?: () => void }) => (
    <button
        onClick={onClick}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </button>
);

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
        className={cn('text-sm text-gray-500', className)}
        {...props}
    />
);

interface DialogTriggerProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLElement, DialogTriggerProps>(
    ({ children, asChild, ...props }, ref) => {
        if (asChild) {
            // If asChild is true, return the children as-is (assuming it's a valid React element)
            return <>{children}</>;
        }
        return <button {...props}>{children}</button>;
    }
);
DialogTrigger.displayName = 'DialogTrigger';

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose, DialogDescription, DialogTrigger };
