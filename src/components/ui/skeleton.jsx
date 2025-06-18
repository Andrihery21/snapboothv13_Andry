import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-zinc-700 ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className = "", ...props }) {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 w-full ${i === lines - 1 && lines > 1 ? "w-4/5" : ""}`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md", className = "", ...props }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };

  const sizeClass = sizes[size] || sizes.md;

  return <Skeleton className={`rounded-full ${sizeClass} ${className}`} {...props} />;
}

export function SkeletonButton({ size = "md", className = "", ...props }) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12"
  };

  const sizeClass = sizes[size] || sizes.md;

  return <Skeleton className={`w-24 ${sizeClass} ${className}`} {...props} />;
}

export function SkeletonCard({ className = "", ...props }) {
  return (
    <div className={`space-y-5 rounded-lg border border-gray-200 dark:border-zinc-700 p-6 ${className}`} {...props}>
      <div className="flex items-center space-x-4">
        <SkeletonAvatar />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex items-center space-x-4">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 3, className = "", ...props }) {
  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="rounded-t-lg border border-gray-200 dark:border-zinc-700 p-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-6 flex-1" />
          ))}
        </div>
      </div>
      <div className="border-x border-gray-200 dark:border-zinc-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b border-gray-200 dark:border-zinc-700 p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-5 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
