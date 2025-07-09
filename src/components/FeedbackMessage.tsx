import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface FeedbackMessageProps {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
}

export function FeedbackMessage({ type, message, onClose }: FeedbackMessageProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const bgColor = type === 'success' 
    ? (isDark ? 'bg-green-900/20' : 'bg-green-50') 
    : (isDark ? 'bg-red-900/20' : 'bg-red-50');
  
  const borderColor = type === 'success' 
    ? (isDark ? 'border-green-700' : 'border-green-400') 
    : (isDark ? 'border-red-700' : 'border-red-400');
  
  const textColor = type === 'success' 
    ? (isDark ? 'text-green-400' : 'text-green-800') 
    : (isDark ? 'text-red-400' : 'text-red-800');
  
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-6 relative animate-in fade-in duration-300`}>
      <div className="flex items-start">
        <Icon className={`${textColor} w-5 h-5 mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`${textColor} text-sm`}>{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className={`${textColor} hover:opacity-70 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
} 