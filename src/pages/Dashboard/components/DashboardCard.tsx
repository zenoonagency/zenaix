import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function DashboardCard({ title, value, icon, onClick }: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{value}</p>
        </div>
        <div className="bg-[#7f00ff]/10 dark:bg-[#7f00ff]/20 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}