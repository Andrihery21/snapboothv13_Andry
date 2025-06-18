import React, { useState } from "react";

export function Tooltip({ 
  children, 
  content, 
  position = "top", 
  delay = 400,
  className = "", 
  ...props 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const positions = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1",
    bottom: "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1",
    left: "right-full top-1/2 transform -translate-x-2 -translate-y-1/2 mr-1",
    right: "left-full top-1/2 transform translate-x-2 -translate-y-1/2 ml-1"
  };

  const arrows = {
    top: "top-full left-1/2 transform -translate-x-1/2 -translate-y-1 border-t-gray-800 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 translate-y-1 border-b-gray-800 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 transform -translate-x-1 -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 transform translate-x-1 -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent"
  };

  const positionClass = positions[position] || positions.top;
  const arrowClass = arrows[position] || arrows.top;

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      {...props}
    >
      {children}
      {isVisible && (
        <>
          <div 
            className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-lg shadow-sm transition-opacity duration-300 ${positionClass} ${className}`}
            role="tooltip"
          >
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClass}`}></div>
          </div>
        </>
      )}
    </div>
  );
}
