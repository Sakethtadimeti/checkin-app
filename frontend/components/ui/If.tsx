import React from "react";

interface IfProps {
  condition: boolean;
  children: React.ReactNode;
}

/**
 * Conditional rendering component
 * Only renders children when condition is true
 */
export const If: React.FC<IfProps> = ({ condition, children }) => {
  if (!condition) {
    return null;
  }

  return <>{children}</>;
};
