import React from "react";

export function Badge({ 
  children, 
  variant = "default", 
  size = "md", 
  className = "", 
  ...props 
}) {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    primary: "bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
    secondary: "bg-secondary-50 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300",
    success: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    outline: "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 bg-transparent"
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5 rounded",
    md: "text-sm px-2.5 py-0.5 rounded-md",
    lg: "text-base px-3 py-1 rounded-lg"
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span 
      className={`inline-flex items-center font-medium ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
