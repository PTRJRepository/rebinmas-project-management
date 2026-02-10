'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumbs } from '@/components/Breadcrumbs';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        // Fetch projects for sidebar
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data.map((p: any) => ({ id: p.id, name: p.name })));
                }
            })
            .catch(err => console.error('Failed to load projects for sidebar:', err));
    }, []);

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar projects={projects} collapsed={collapsed} onCollapse={setCollapsed} />
            <main
                id="main-content"
                className={`w-full transition-all duration-300 ease-in-out ${collapsed ? 'pl-16' : 'pl-64'}`}
            >
                <div className="w-full">
                    <div className="fade-in-up">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
