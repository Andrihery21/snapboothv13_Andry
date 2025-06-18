import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-card dark:shadow-card-dark font-sans ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div
      className={`flex flex-col space-y-1.5 px-6 py-4 border-b border-gray-200 dark:border-zinc-700 font-sans ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white font-sans ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p
      className={`text-sm text-gray-600 dark:text-gray-400 font-sans ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return (
    <div
      className={`p-6 font-sans ${className}`}
      {...props}
    />
  );
}

export function CardFooter({ className = "", ...props }) {
  return (
    <div
      className={`flex items-center px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 rounded-b-lg font-sans ${className}`}
      {...props}
    />
  );
}
