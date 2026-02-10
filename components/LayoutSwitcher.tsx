'use client';

import { useLayout, ViewLayout } from './layout-provider';
import { LayoutGrid, LayoutList, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const layouts: {
  value: ViewLayout;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'grid',
    label: 'Grid View',
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    value: 'list',
    label: 'List View',
    icon: <LayoutList className="w-4 h-4" />,
  },
  {
    value: 'compact',
    label: 'Compact View',
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
];

export function LayoutSwitcher() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
      {layouts.map((l) => (
        <Button
          key={l.value}
          variant="ghost"
          size="sm"
          onClick={() => setLayout(l.value)}
          className={cn(
            "h-8 px-3 transition-all duration-200",
            layout === l.value
              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
          title={l.label}
        >
          {l.icon}
        </Button>
      ))}
    </div>
  );
}
