import React from "react";

export function Input({
  className = "", 
  type = "text",
  disabled = false,
  error = false,
  icon,
  ...props
}) {
  const baseClasses = `flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-sans dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder:text-gray-400`;
  
  const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500 dark:border-red-400 dark:focus-visible:ring-red-400' : '';
  const iconClasses = icon ? 'pl-10' : '';
  
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
        disabled={disabled}
        {...props}
      />
      {error && typeof error === 'string' && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
