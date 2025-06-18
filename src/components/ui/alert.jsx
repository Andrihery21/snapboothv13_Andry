import React from "react";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

export function Alert({ 
  children, 
  variant = "info", 
  title,
  onClose,
  className = "", 
  ...props 
}) {
  const variants = {
    info: {
      container: "bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      icon: <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
    },
    success: {
      container: "bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-800",
      icon: <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
    },
    warning: {
      container: "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
    },
    error: {
      container: "bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-800",
      icon: <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
    }
  };

  const variantStyle = variants[variant] || variants.info;

  return (
    <div 
      className={`flex p-4 mb-4 border-l-4 rounded-r-lg ${variantStyle.container} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex items-center">
        <div className="mr-3 flex-shrink-0">
          {variantStyle.icon}
        </div>
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900"
            onClick={onClose}
            aria-label="Fermer"
          >
            <span className="sr-only">Fermer</span>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
