import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface text-foreground p-5 shadow-xs transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

