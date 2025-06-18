import React from "react";

export function Progress({
  value = 0,
  max = 100,
  size = "md",
  variant = "primary",
  showValue = false,
  valueFormat,
  className = "",
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    xs: "h-1",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-5"
  };
  
  const variants = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500"
  };
  
  const sizeClass = sizes[size] || sizes.md;
  const variantClass = variants[variant] || variants.primary;
  
  const formattedValue = valueFormat 
    ? valueFormat(value, max, percentage) 
    : `${Math.round(percentage)}%`;
  
  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="flex items-center justify-between mb-1">
        {props.label && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {props.label}
          </div>
        )}
        {showValue && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formattedValue}
          </div>
        )}
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700 ${sizeClass}`}>
        <div
          className={`rounded-full ${variantClass} transition-all duration-300 ease-in-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

export function ProgressIndeterminate({
  size = "md",
  variant = "primary",
  className = "",
  ...props
}) {
  const sizes = {
    xs: "h-1",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-5"
  };
  
  const variants = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500"
  };
  
  const sizeClass = sizes[size] || sizes.md;
  const variantClass = variants[variant] || variants.primary;
  
  return (
    <div className={`w-full ${className}`} {...props}>
      {props.label && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {props.label}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700 ${sizeClass}`}>
        <div
          className={`animate-progress-indeterminate ${variantClass} h-full w-1/3 rounded-full`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
