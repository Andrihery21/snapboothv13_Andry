import React from "react";

export function Label({
  className = "font-sans", 
  htmlFor,
  disabled = false,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-sans text-primary dark:text-primary-dark ${
        disabled ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    />
  );
}
