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
    PanelLeftClose,
    PanelLeftOpen,
    Briefcase,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenu } from '@/components/auth/user-menu';

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
                'fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out z-30 shadow-sm',
                collapsed ? 'w-16' : 'w-64'
            )}
            aria-label="Main navigation sidebar"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className={cn(
                    "h-16 flex items-center border-b border-slate-700/50 transition-all duration-300",
                    collapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-slate-100 tracking-tight text-lg truncate">Rebinmas</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                    )}



                    {!collapsed && (
                        <button
                            onClick={handleToggle}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(var(--bg-hover))'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Collapsed Toggle (when collapsed, it sits at the bottom or top? Let's keep it consistent) 
                    Actually standard pattern is usually header or specific toggle button. 
                    Let's put a toggle button at the bottom of nav if collapsed? 
                    Or just keep the header item interactive?
                */}

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                    {/* Main Menu */}
                    <div>
                        <div className={cn(
                            "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3",
                            collapsed && "text-center"
                        )}>
                            {collapsed ? 'Menu' : 'Main Menu'}
                        </div>
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                                            collapsed && 'justify-center px-0',
                                            active
                                                ? 'bg-sky-500/20 text-sky-400'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        )}
                                        title={collapsed ? item.name : undefined}
                                    >
                                        <item.icon className={cn(
                                            "flex-shrink-0 transition-colors",
                                            collapsed ? "w-5 h-5" : "w-5 h-5",
                                            active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                                        )} />
                                        {!collapsed && (
                                            <span className="font-medium text-sm">{item.name}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    {!collapsed && <div className="border-t border-slate-700/50 mx-2" />}

                    {/* Projects Section */}
                    {!collapsed && projects.length > 0 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="px-3 py-2 flex items-center justify-between group cursor-pointer">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-400 transition-colors">
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
                                                ? 'bg-sky-500/20 text-sky-400'
                                                : 'text-slate-400 hover:bg-slate-800'
                                        )}
                                        title={project.name}
                                    >
                                        <div className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
                                            isActive(`/projects/${project.id}`)
                                                ? "bg-sky-400"
                                                : "bg-slate-600 group-hover:bg-slate-500"
                                        )} aria-hidden="true" />
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
                        className="w-full p-4 flex justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors border-t border-slate-700/50"
                    >
                        <PanelLeftOpen className="w-5 h-5" />
                    </button>
                )}

                {/* User Profile */}
                <UserMenu collapsed={collapsed} />
            </div>
        </aside>
    );
}
