'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { getNextTheme, Theme } from '@/lib/theme-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
  };

  const getThemeLabel = (currentTheme: Theme): string => {
    switch (currentTheme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
    }
  };

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getNextThemeLabel = (currentTheme: Theme): string => {
    const nextTheme = getNextTheme(currentTheme);
    return `Switch to ${getThemeLabel(nextTheme)}`;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9"
            aria-label={getNextThemeLabel(theme)}
          >
            {getThemeIcon(theme)}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          <p>{getThemeLabel(theme)}</p>
          <p className="text-xs text-muted-foreground">{getNextThemeLabel(theme)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
