'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    Briefcase,
    FileText,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    ChevronRight,
    Search,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/auth/user-menu';

interface SidebarProps {
    projects?: Array<{
        id: string;
        name: string;
    }>;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
    userRole?: string;
}

export function Sidebar({ projects = [], collapsed: controlledCollapsed, onCollapse, userRole }: SidebarProps) {
    const [localCollapsed, setLocalCollapsed] = useState(false);
    const [projectsExpanded, setProjectsExpanded] = useState(true);
    const pathname = usePathname();

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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Reports', href: '/reports', icon: FileText },
    ];
    
    if (userRole === 'ADMIN') {
        navItems.push({ name: 'Admin Panel', href: '/admin', icon: ShieldCheck });
    }
    
    navItems.push({ name: 'Settings', href: '/settings', icon: Settings });

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen sidebar-glass transition-all duration-300 ease-in-out z-30 flex flex-col',
                collapsed ? 'w-18' : 'w-64'
            )}
        >
            {/* Header */}
            <div className={cn(
                "h-16 flex items-center transition-all duration-300 border-b border-white/5",
                collapsed ? "justify-center" : "justify-between px-6"
            )}>
                {!collapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-50 tracking-tight text-lg truncate">Schedule</span>
                    </div>
                )}
                {collapsed && (
                    <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Briefcase className="w-4 h-4 text-white" />
                    </div>
                )}
                
                {!collapsed && (
                    <button
                        onClick={handleToggle}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-all"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
                {/* Search - Figma style */}
                {!collapsed && (
                    <div className="px-3">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="w-full bg-slate-900/50 border border-white/5 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Main Menu */}
                <div className="space-y-1">
                    {!collapsed && (
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-4">
                            Main Menu
                        </div>
                    )}
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative',
                                    collapsed && 'justify-center',
                                    active
                                        ? 'bg-sky-500/10 text-sky-400'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon className={cn(
                                    "w-4 h-4 flex-shrink-0 transition-colors",
                                    active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"
                                )} />
                                {!collapsed && (
                                    <span className="font-medium text-sm">{item.name}</span>
                                )}
                                {active && (
                                    <div className="absolute left-0 w-1 h-4 bg-sky-500 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Projects Section - Figma Collapsible Style */}
                {!collapsed && (
                    <div className="space-y-1">
                        <div 
                            className="flex items-center justify-between px-4 py-2 cursor-pointer group"
                            onClick={() => setProjectsExpanded(!projectsExpanded)}
                        >
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                                Projects
                            </div>
                            {projectsExpanded ? (
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            ) : (
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                            )}
                        </div>
                        
                        {projectsExpanded && (
                            <div className="space-y-0.5 mt-1 animate-in slide-in-from-top-1 duration-200">
                                {projects.length > 0 ? (
                                    projects.slice(0, 8).map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/projects/${project.id}`}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-1.5 rounded-lg transition-all text-sm group',
                                                isActive(`/projects/${project.id}`)
                                                    ? 'text-sky-400 font-medium'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all",
                                                isActive(`/projects/${project.id}`)
                                                    ? "bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                                                    : "bg-slate-600 group-hover:bg-slate-400"
                                            )} />
                                            <span className="truncate">{project.name}</span>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-xs text-slate-600 italic">No projects yet</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 space-y-2">
                {collapsed && (
                    <button
                        onClick={handleToggle}
                        className="w-full p-2 flex justify-center text-slate-400 hover:text-slate-50 hover:bg-white/5 rounded-lg transition-all"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}
                <UserMenu collapsed={collapsed} />
            </div>
        </aside>
    );
}
