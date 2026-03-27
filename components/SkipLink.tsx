'use client';

import Link from 'next/link';

export function SkipLink() {
    return (
        <Link
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-slate-900 focus:text-white focus:rounded-md focus:shadow-xl"
        >
            Skip to main content
        </Link>
    );
}
