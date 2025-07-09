import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  actionLabel: string;
  onActionClick: () => void;
  children: React.ReactNode;
}

export function DashboardSection({
  title,
  actionLabel,
  onActionClick,
  children
}: DashboardSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <button
          onClick={onActionClick}
          className="flex items-center text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      {children}
    </div>
  );
}