import React from "react";
import { Check } from "lucide-react";

export function Checkbox({
  className = "",
  checked = false,
  disabled = false,
  error = false,
  label,
  onChange,
  ...props
}) {
  const baseClasses = "h-4 w-4 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800";
  const checkedClasses = checked ? "bg-primary border-primary text-white dark:bg-primary dark:border-primary" : "";
  const errorClasses = error ? "border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400" : "";
  
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <div className="relative inline-flex items-center justify-center">
          <input
            type="checkbox"
            className={`${baseClasses} ${checkedClasses} ${errorClasses} ${className} absolute opacity-0 h-4 w-4 cursor-pointer`}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            {...props}
          />
          <div className={`${baseClasses} ${checkedClasses} ${errorClasses} flex items-center justify-center`}>
            {checked && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      </div>
      {label && (
        <div className="ml-2 text-sm">
          <label className={`font-medium text-gray-900 dark:text-white ${disabled ? 'opacity-50' : ''}`}>
            {label}
          </label>
        </div>
      )}
      {error && typeof error === 'string' && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
