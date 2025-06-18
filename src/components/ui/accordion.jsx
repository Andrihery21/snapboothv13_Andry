import React, { useState, createContext, useContext } from "react";
import { ChevronDown } from "lucide-react";

const AccordionContext = createContext({
  expandedItems: [],
  toggleItem: () => {},
  allowMultiple: false
});

export function Accordion({ 
  children, 
  defaultExpanded = [], 
  allowMultiple = false,
  className = "", 
  ...props 
}) {
  const [expandedItems, setExpandedItems] = useState(defaultExpanded);

  const toggleItem = (itemId) => {
    if (allowMultiple) {
      setExpandedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId) 
          : [...prev, itemId]
      );
    } else {
      setExpandedItems(prev => 
        prev.includes(itemId) ? [] : [itemId]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, allowMultiple }}>
      <div className={`divide-y divide-gray-200 dark:divide-zinc-700 rounded-md border border-gray-200 dark:border-zinc-700 ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ 
  children, 
  id, 
  className = "", 
  ...props 
}) {
  const { expandedItems } = useContext(AccordionContext);
  const isExpanded = expandedItems.includes(id);

  return (
    <div 
      className={`${className}`}
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { id, isExpanded });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({ 
  children, 
  id, 
  isExpanded, 
  className = "", 
  ...props 
}) {
  const { toggleItem } = useContext(AccordionContext);

  return (
    <button
      type="button"
      onClick={() => toggleItem(id)}
      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 ${className}`}
      aria-expanded={isExpanded}
      {...props}
    >
      {children}
      <ChevronDown 
        className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
      />
    </button>
  );
}

export function AccordionContent({ 
  children, 
  id, 
  isExpanded, 
  className = "", 
  ...props 
}) {
  if (!isExpanded) return null;

  return (
    <div
      className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
