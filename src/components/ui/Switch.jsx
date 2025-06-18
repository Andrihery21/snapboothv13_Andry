import React from 'react';
import { motion } from 'framer-motion';

export const Switch = ({ 
  checked, 
  onChange, 
  className, 
  label,
  disabled = false,
  ...props 
}) => {
  const baseClass = "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
  const colorClass = checked ? 'bg-primary dark:bg-primary' : 'bg-gray-300 dark:bg-gray-600';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const combinedClass = `${colorClass} ${className || ''} ${baseClass} ${disabledClass}`;

  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleChange}
        className={combinedClass}
        disabled={disabled}
        {...props}
      >
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
        <motion.span
          layout
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className={`${
            checked ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 shadow-sm`}
        />
      </button>
      {label && (
        <span className={`ml-2 text-sm font-medium text-gray-900 dark:text-white ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default Switch;
