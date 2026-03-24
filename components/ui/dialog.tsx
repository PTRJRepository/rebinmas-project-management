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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm side-panel-overlay"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative bg-slate-950 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full max-h-[90vh] overflow-auto side-panel-content animate-slide-in-right">
                <DialogClose onClick={() => onOpenChange?.(false)} />
                {children}
            </div>
        </div>
    );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left px-6 pt-6 pb-2', className)}
        {...props}
    />
);

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
        className={cn('text-xl font-bold leading-none tracking-tight text-slate-100 font-space-grotesk', className)}
        {...props}
    />
);

const DialogContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('px-6 py-4', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 px-6 py-6 border-t border-white/5', className)}
        {...props}
    />
);

const DialogClose = ({ onClick }: { onClick?: () => void }) => (
    <button
        onClick={onClick}
        className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all z-10"
    >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </button>
);

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
        className={cn('text-sm text-slate-400', className)}
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
            // If asChild is true, we need to clone the child and pass props
            const child = React.Children.only(children) as React.ReactElement<any>;
            return React.cloneElement(child, {
                ...props,
                onClick: (e: React.MouseEvent) => {
                    if (child.props && child.props.onClick) {
                        child.props.onClick(e);
                    }
                    if (props.onClick) {
                        (props.onClick as any)(e);
                    }
                }
            });
        }
        return <button {...props}>{children}</button>;
    }
);
DialogTrigger.displayName = 'DialogTrigger';

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose, DialogDescription, DialogTrigger };
