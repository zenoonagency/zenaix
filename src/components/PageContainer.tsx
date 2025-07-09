import React from 'react';

interface PageContainerProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  search?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  icon,
  title,
  subtitle,
  actionButton,
  search,
  children,
}: PageContainerProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 mb-4">
          {icon && (
            <div className="p-2 border border-purple-500 rounded-lg">{icon}</div>
          )}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
            {title}
          </h1>
        </div>
        {actionButton}
      </div>
      {subtitle && (
        <div className="-mt-4 mb-2 text-gray-500 text-sm">{subtitle}</div>
      )}
      {search && <div>{search}</div>}
      <div>{children}</div>
    </div>
  );
} 