import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function Dropdown({
  trigger,
  children,
  align = "left",
  width = "auto",
  className = "",
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const alignments = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2"
  };
  
  const widths = {
    auto: "min-w-[8rem]",
    sm: "w-48",
    md: "w-56",
    lg: "w-64",
    full: "w-full"
  };
  
  const alignmentClass = alignments[align] || alignments.left;
  const widthClass = widths[width] || widths.auto;
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef} {...props}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute z-10 mt-2 ${alignmentClass} ${widthClass} rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ 
  children, 
  onClick, 
  disabled = false, 
  className = "", 
  ...props 
}) {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };
  
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:pointer-events-none ${className}`}
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownDivider({ className = "", ...props }) {
  return (
    <div 
      className={`my-1 h-px bg-gray-200 dark:bg-zinc-700 ${className}`} 
      role="separator"
      {...props} 
    />
  );
}

export function DropdownHeader({ children, className = "", ...props }) {
  return (
    <div 
      className={`px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
