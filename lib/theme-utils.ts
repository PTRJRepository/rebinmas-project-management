export type Theme = 'light' | 'dark' | 'system';

/**
 * Get the next theme in the cycle: light → dark → system → light
 * @param currentTheme - The current theme
 * @returns The next theme in the cycle
 */
export function getNextTheme(currentTheme: Theme): Theme {
  switch (currentTheme) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
    default:
      return 'system';
  }
}

/**
 * Get the actual theme to apply (resolving 'system' to 'light' or 'dark')
 * @param theme - The theme setting ('light', 'dark', or 'system')
 * @returns The actual theme to apply ('light' or 'dark')
 */
export function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Apply the theme to the document element
 * @param theme - The theme to apply
 */
export function applyTheme(theme: Theme): void {
  const resolvedTheme = getResolvedTheme(theme);
  const root = document.documentElement;

  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Also set the data-theme attribute for CSS targeting
  root.setAttribute('data-theme', resolvedTheme);
}
