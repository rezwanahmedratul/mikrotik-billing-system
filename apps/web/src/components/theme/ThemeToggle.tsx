'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'compact';
}

export function ThemeToggle({ className = '', variant = 'button' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`relative flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-2xs transition-all hover:bg-neutral-100 hover:text-black dark:border-neutral-800 dark:bg-black dark:text-neutral-100 dark:hover:bg-neutral-900 dark:hover:text-white ${className}`}
      >
        <span className="sr-only">Toggle theme</span>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-neutral-900" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-neutral-100" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-2xs transition-all hover:bg-neutral-100 hover:text-black dark:border-neutral-800 dark:bg-black dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-white ${className}`}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-neutral-900" />
        <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-neutral-100" />
      </div>
      <span className="text-[11px] font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
    </button>
  );
}
