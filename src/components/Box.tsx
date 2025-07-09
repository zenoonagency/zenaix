import React from 'react';
import { useThemeStore } from '../store/themeStore';

interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

export function Box({ children, className = '' }: BoxProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className={`bg-white dark:bg-dark-800 border ${
      isDark ? 'border-dark-700' : 'border-gray-200'
    } rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
} 