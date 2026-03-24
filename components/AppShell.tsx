'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

interface AppShellProps {
    children: React.ReactNode;
    isAuthenticated?: boolean;
}

export function AppShell({ children, isAuthenticated = false }: AppShellProps) {
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch projects for sidebar
            fetch('/api/projects')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setProjects(data.map((p: any) => ({ id: p.id, name: p.name })));
                    }
                })
                .catch(err => console.error('Failed to load projects for sidebar:', err));
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col">
                <main id="main-content" className="flex-1 w-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(14,165,233,0.1),transparent_50%)]" />
            </div>

            <Sidebar 
                projects={projects} 
                collapsed={collapsed} 
                onCollapse={setCollapsed} 
            />
            
            <main
                id="main-content"
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out relative flex flex-col h-screen overflow-hidden",
                    collapsed ? "ml-18" : "ml-64"
                )}
            >
                <div className="flex-1 overflow-auto bg-slate-950/20">
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-500 h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
