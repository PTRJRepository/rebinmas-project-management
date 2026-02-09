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
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar projects={projects} collapsed={collapsed} onCollapse={setCollapsed} />
            <main
                id="main-content"
                className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-16' : 'ml-64'} p-8`}
            >
                <div className="max-w-7xl mx-auto">
                    <Breadcrumbs projects={projects} />
                    <div className="fade-in-up">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
