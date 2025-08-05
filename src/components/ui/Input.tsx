import * as React from "react";

import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, labelClassName = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:shadow-[0_4px_4px_rgba(127,0,255,0.08)] focus:border-purple-500 transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
