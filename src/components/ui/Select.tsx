import React, { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
