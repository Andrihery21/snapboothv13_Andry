import React from "react";

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  status,
  statusPosition = "bottom-right",
  className = "",
  ...props
}) {
  const [error, setError] = React.useState(false);

  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
    "2xl": "h-20 w-20 text-2xl"
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-500"
  };

  const statusPositions = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0"
  };

  const sizeClass = sizes[size] || sizes.md;
  const statusColorClass = status ? statusColors[status] || statusColors.offline : "";
  const statusPositionClass = statusPosition ? statusPositions[statusPosition] || statusPositions["bottom-right"] : "";

  const handleError = () => {
    setError(true);
  };

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      <div
        className={`overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center ${sizeClass}`}
      >
        {!error && src ? (
          <img
            src={src}
            alt={alt}
            onError={handleError}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-medium text-gray-600 dark:text-gray-300">
            {fallback || alt.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </div>
      
      {status && (
        <span
          className={`absolute block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 ${statusColorClass} ${statusPositionClass}`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({
  children,
  max,
  size = "md",
  className = "",
  ...props
}) {
  const childrenArray = React.Children.toArray(children);
  const excess = max ? childrenArray.length - max : 0;
  const displayChildren = max ? childrenArray.slice(0, max) : childrenArray;

  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {displayChildren.map((child, index) => (
        <div key={index} className="relative inline-block ring-2 ring-white dark:ring-zinc-900 rounded-full">
          {React.cloneElement(child, {
            size: child.props.size || size
          })}
        </div>
      ))}
      
      {excess > 0 && (
        <div
          className={`relative inline-block bg-gray-100 dark:bg-zinc-800 rounded-full ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 ${sizes[size] || sizes.md}`}
        >
          +{excess}
        </div>
      )}
    </div>
  );
}
