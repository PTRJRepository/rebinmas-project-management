'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ViewLayout = 'grid' | 'list' | 'focus';

interface LayoutContextType {
  layout: ViewLayout;
  setLayout: (layout: ViewLayout) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = 'schedule-tracker-layout';

interface LayoutProviderProps {
  children: React.ReactNode;
  defaultLayout?: ViewLayout;
  storageKey?: string;
}

export function LayoutProvider({
  children,
  defaultLayout = 'grid',
  storageKey = LAYOUT_STORAGE_KEY,
}: LayoutProviderProps) {
  const [layout, setLayoutState] = useState<ViewLayout>(defaultLayout);
  const [mounted, setMounted] = useState(false);

  // Initialize layout from localStorage on mount
  useEffect(() => {
    const storedLayout = localStorage.getItem(storageKey) as ViewLayout | null;
    if (storedLayout && ['grid', 'list', 'focus'].includes(storedLayout)) {
      setLayoutState(storedLayout);
    }
    setMounted(true);
  }, [storageKey]);

  // Save layout whenever it changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(storageKey, layout);
  }, [layout, mounted, storageKey]);

  const setLayout = (newLayout: ViewLayout) => {
    setLayoutState(newLayout);
  };

  const value = {
    layout,
    setLayout,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);

  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }

  return context;
}
