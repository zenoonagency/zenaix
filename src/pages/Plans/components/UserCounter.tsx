import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface UserCounterProps {
  onTotalChange: (total: number) => void;
  minUsers?: number;
  maxUsers?: number;
  pricePerUser?: number;
}

export function UserCounter({
  onTotalChange,
  minUsers = 0,
  maxUsers = 10,
  pricePerUser = 97
}: UserCounterProps) {
  const [additionalUsers, setAdditionalUsers] = useState(0);

  const handleIncrement = () => {
    if (additionalUsers < maxUsers) {
      const newCount = additionalUsers + 1;
      setAdditionalUsers(newCount);
      onTotalChange(newCount);
    }
  };

  const handleDecrement = () => {
    if (additionalUsers > 0) {
      const newCount = additionalUsers - 1;
      setAdditionalUsers(newCount);
      onTotalChange(newCount);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleDecrement}
        disabled={additionalUsers <= 0}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${additionalUsers <= 0
            ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500'
          }
          transition-colors duration-200
        `}
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center min-w-[3rem]">
        <span className="text-2xl font-semibold text-gray-900 dark:text-white">
          {additionalUsers}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          adicionais
        </span>
      </div>

      <button
        onClick={handleIncrement}
        disabled={additionalUsers >= maxUsers}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${additionalUsers >= maxUsers
            ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500'
          }
          transition-colors duration-200
        `}
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
} 