'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    ChevronLeft,
    ChevronRight,
    Home,
    User,
    PanelLeftClose,
    PanelLeftOpen,
    Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';

interface SidebarProps {
    projects?: Array<{
        id: string;
        name: string;
    }>;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ projects = [], collapsed: controlledCollapsed, onCollapse }: SidebarProps) {
    const [localCollapsed, setLocalCollapsed] = useState(false);
    const pathname = usePathname();

    // Use controlled collapsed if provided, otherwise use local state
    const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;

    const handleToggle = () => {
        const newCollapsed = !collapsed;
        if (onCollapse) {
            onCollapse(newCollapsed);
        } else {
            setLocalCollapsed(newCollapsed);
        }
    };

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/');
    };

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            name: 'Projects',
            href: '/projects',
            icon: FolderKanban,
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
        },
    ];

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30 shadow-sm',
                collapsed ? 'w-16' : 'w-64'
            )}
            aria-label="Main navigation sidebar"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className={cn(
                    "h-16 flex items-center border-b border-gray-100 transition-all duration-300",
                    collapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)' }}>
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-800 tracking-tight text-lg truncate">Rebinmas</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)' }}>
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                    )}

                    {!collapsed && (
                        <div className="flex items-center gap-1">
                            <ThemeToggle />
                            <button
                                onClick={handleToggle}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                                style={{ backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(var(--bg-hover))'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                aria-label="Collapse sidebar"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Collapsed Toggle (when collapsed, it sits at the bottom or top? Let's keep it consistent) 
                    Actually standard pattern is usually header or specific toggle button. 
                    Let's put a toggle button at the bottom of nav if collapsed? 
                    Or just keep the header item interactive?
                */}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
                    <TooltipProvider delayDuration={0}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            const linkContent = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                                        active
                                            ? 'font-medium'
                                            : 'text-gray-600 hover:text-gray-900',
                                        collapsed && 'justify-center px-2'
                                    )}
                                    style={active ? {
                                        backgroundColor: 'rgb(var(--color-primary-light))',
                                        color: 'rgb(var(--color-primary))'
                                    } : {
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.backgroundColor = 'rgb(var(--bg-hover))';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5 flex-shrink-0 transition-colors",
                                        active ? "" : "text-gray-500 group-hover:text-gray-700"
                                    )} style={active ? { color: 'rgb(var(--color-primary))' } : {}} aria-hidden="true" />

                                    {!collapsed && (
                                        <span className="text-sm">{item.name}</span>
                                    )}

                                    {/* Active Indicator Bar */}
                                    {active && !collapsed && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }} />
                                    )}
                                </Link>
                            );

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium bg-gray-900 text-white border-0">
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            }

                            return linkContent;
                        })}
                    </TooltipProvider>

                    {/* Divider */}
                    {!collapsed && <div className="my-4 border-t border-gray-100 mx-2" />}

                    {/* Projects Section */}
                    {!collapsed && projects.length > 0 && (
                        <div className="mt-2 animate-in fade-in duration-300">
                            <div className="px-3 py-2 flex items-center justify-between group cursor-pointer">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                                    Recent Projects
                                </span>
                            </div>
                            <div className="space-y-0.5 mt-1">
                                {projects.slice(0, 5).map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm group',
                                            isActive(`/projects/${project.id}`)
                                                ? ''
                                                : 'text-gray-600'
                                        )}
                                        style={isActive(`/projects/${project.id}`) ? {
                                            backgroundColor: 'rgb(var(--color-primary-light))',
                                            color: 'rgb(var(--color-primary))'
                                        } : {
                                            backgroundColor: 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive(`/projects/${project.id}`)) {
                                                e.currentTarget.style.backgroundColor = 'rgb(var(--bg-hover))';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive(`/projects/${project.id}`)) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                        title={project.name}
                                    >
                                        <div className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
                                            isActive(`/projects/${project.id}`) ? "" : "group-hover:bg-gray-400"
                                        )} style={isActive(`/projects/${project.id}`) ? { backgroundColor: 'rgb(var(--color-primary))' } : { backgroundColor: 'rgb(209 213 219)' }} aria-hidden="true" />
                                        <span className="truncate">{project.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Collapse Toggle for Collapsed State */}
                {collapsed && (
                    <button
                        onClick={handleToggle}
                        className="w-full p-4 flex justify-center text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(var(--bg-hover))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <PanelLeftOpen className="w-5 h-5" />
                    </button>
                )}

                {/* User Profile */}
                <div className={cn(
                    "border-t border-gray-100 bg-gray-50/50",
                    collapsed ? "p-2" : "p-4"
                )}>
                    <div
                        className={cn(
                            'flex items-center gap-3 rounded-lg hover:shadow-sm transition-all cursor-pointer p-2',
                            collapsed && 'justify-center'
                        )}
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(var(--bg-surface))'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-white font-medium text-xs">
                            <User className="w-4 h-4" />
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">Demo User</p>
                                <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
