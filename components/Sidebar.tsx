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
    Users,
    FileText
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
            name: 'Reports',
            href: '/reports',
            icon: FileText,
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
                'fixed left-0 top-0 h-screen glass-panel border-r border-cyan-500/10 transition-all duration-300 ease-in-out z-30',
                collapsed ? 'w-16' : 'w-64'
            )}
            aria-label="Main navigation sidebar"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className={cn(
                    "h-16 flex items-center border-b border-cyan-500/10 transition-all duration-300",
                    collapsed ? "justify-center px-0" : "justify-between px-4"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.4)]" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)' }}>
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-sky-100 tracking-tight text-lg truncate heading-glow">Rebinmas</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)' }}>
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                    )}



                    {!collapsed && (
                        <button
                            onClick={handleToggle}
                            className="p-1.5 rounded-md text-sky-400 hover:text-cyan-400 transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
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
                            "text-xs font-semibold text-sky-500/70 uppercase tracking-wider mb-3 px-3",
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
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                                            collapsed && 'justify-center px-0',
                                            active
                                                ? 'glass-cyan text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                                                : 'text-sky-400/70 hover:bg-sky-500/10 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                                        )}
                                        title={collapsed ? item.name : undefined}
                                    >
                                        <item.icon className={cn(
                                            "flex-shrink-0 transition-colors",
                                            collapsed ? "w-5 h-5" : "w-5 h-5",
                                            active ? "text-cyan-400" : "text-sky-400/70 group-hover:text-cyan-400"
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
                    {!collapsed && <div className="border-t border-cyan-500/10 mx-2" />}

                    {/* Projects Section */}
                    {!collapsed && projects.length > 0 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="px-3 py-2 flex items-center justify-between group cursor-pointer">
                                <span className="text-xs font-semibold text-sky-500/70 uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                                    Recent Projects
                                </span>
                            </div>
                            <div className="space-y-0.5 mt-1">
                                {projects.slice(0, 5).map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm group',
                                            isActive(`/projects/${project.id}`)
                                                ? 'glass-cyan text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                                                : 'text-sky-400/70 hover:bg-sky-500/10 hover:text-cyan-400'
                                        )}
                                        title={project.name}
                                    >
                                        <div className={cn(
                                            "w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200",
                                            isActive(`/projects/${project.id}`)
                                                ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                                : "bg-sky-500/40 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)]"
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
                        className="w-full p-4 flex justify-center text-sky-400/70 hover:text-cyan-400 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(34,211,238,0.15)] transition-all duration-200 border-t border-cyan-500/10"
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
