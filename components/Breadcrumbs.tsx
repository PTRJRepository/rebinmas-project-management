'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
    projects?: Array<{ id: string; name: string }>;
}

export function Breadcrumbs({ projects = [] }: BreadcrumbsProps) {
    const pathname = usePathname();

    if (!pathname || pathname === '/') return null;

    const segments = pathname.split('/').filter(Boolean);

    // Map of path segments to readable names
    const getReadableName = (segment: string, index: number, allSegments: string[]) => {
        // Check if it's a project ID
        const project = projects.find(p => p.id === segment);
        if (project) return project.name;

        // Check if previous segment was "projects" and this is an ID (fallback if name not found)
        if (index > 0 && allSegments[index - 1] === 'projects' && !project) {
            return `Project ${segment.substring(0, 4)}...`;
        }

        // Standard mappings
        const text = segment.replace(/-/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-sky-400 transition-colors"
                title="Dashboard"
            >
                <Home className="w-4 h-4" />
            </Link>

            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const name = getReadableName(segment, index, segments);

                return (
                    <div key={href} className="flex items-center space-x-2">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        {isLast ? (
                            <span className="font-medium text-slate-200" aria-current="page">
                                {name}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-sky-400 transition-colors"
                            >
                                {name}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
