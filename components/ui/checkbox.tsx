
"use strict";

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (checked: boolean) => void }
>(({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onCheckedChange?.(e.target.checked);
        onChange?.(e);
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <input
                type="checkbox"
                className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-transparent cursor-pointer z-10"
                ref={ref}
                onChange={handleChange}
                {...props}
            />
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center text-current opacity-0 peer-checked:opacity-100 peer-checked:bg-primary peer-checked:text-primary-foreground rounded-sm transition-opacity",
                    className
                )}
            >
                <Check className="h-3 w-3 text-white" />
            </div>
            {/* Fallback styling for the box itself when not checked */}
            <div className={cn("pointer-events-none absolute inset-0 rounded-sm border border-primary transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground", className)}></div>
        </div>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
