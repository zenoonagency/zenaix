import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7f00ff] to-[#e100ff] rounded-lg opacity-50"></div>
        <select
          {...props}
          className={`relative w-full px-3 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg text-gray-900 dark:text-white focus:outline-none ${className}`}
        >
          {children}
        </select>
      </div>
    </div>
  );
} 