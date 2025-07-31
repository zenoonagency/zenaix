import React from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        {Icon && (
          <Icon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{title}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>
      {buttonText && (
        <button
          onClick={onButtonClick}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
