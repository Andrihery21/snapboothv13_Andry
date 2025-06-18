import React from "react";

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  onClick,
  icon,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none font-sans";
  
  const variants = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500 dark:bg-violet-500 dark:hover:bg-violet-600 shadow-sm",
    secondary: "border-2 border-violet-600 text-violet-700 hover:bg-violet-50 focus:ring-violet-500 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-900/20",
    tertiary: "text-violet-700 hover:text-violet-800 hover:underline focus:ring-violet-500 dark:text-violet-300 dark:hover:text-violet-200",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 shadow-sm",
    outline: "border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-700 focus:ring-violet-500 shadow-sm",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 focus:ring-violet-500 text-gray-800 dark:text-gray-200",
    link: "text-violet-700 underline-offset-4 hover:underline focus:ring-violet-500 bg-transparent dark:text-violet-300 dark:hover:text-violet-200"
  };
  
  const sizes = {
    sm: "text-sm px-3 py-1.5 rounded",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
    icon: "p-2 rounded-full"
  };
  
  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;
  const iconClasses = icon ? 'gap-2' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${iconClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
}
