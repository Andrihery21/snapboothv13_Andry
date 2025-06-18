import React from "react";
import { ChevronDown } from "lucide-react";

export function Select({
  className = "",
  disabled = false,
  error = false,
  label,
  options = [],
  value,
  onChange,
  placeholder = "Sélectionner une option",
  ...props
}) {
  const baseClasses = `flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-sans dark:bg-zinc-800 dark:border-zinc-700 dark:text-white`;
  
  const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500 dark:border-red-400 dark:focus-visible:ring-red-400' : '';
  
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`${baseClasses} ${errorClasses} ${className}`}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      {error && typeof error === 'string' && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function SelectOption({ value, children }) {
  return (
    <option value={value}>{children}</option>
  );
}
