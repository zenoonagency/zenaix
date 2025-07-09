import React from 'react';
import { CustomField, renderCustomFieldValue } from '../types/customFields';

interface CustomFieldsDisplayProps {
  fields: Record<string, CustomField>;
  className?: string;
}

export function CustomFieldsDisplay({ fields, className = '' }: CustomFieldsDisplayProps) {
  if (!fields || Object.entries(fields).length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {Object.entries(fields).map(([name, field]) => (
        <div key={name} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {name}
          </div>
          <div className="text-gray-900 dark:text-gray-100">
            {typeof renderCustomFieldValue(field.type, field.value) === 'object' ? (
              <a href="#" className="text-[#7f00ff] hover:underline">
                {field.value}
              </a>
            ) : (
              renderCustomFieldValue(field.type, field.value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}