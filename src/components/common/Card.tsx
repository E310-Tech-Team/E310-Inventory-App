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
      className={`rounded-2xl border border-border/70 bg-surface text-foreground p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

