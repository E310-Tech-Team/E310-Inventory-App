"use client";

import React, { useRef, useState } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enableSpotlight?: boolean;
  className?: string;
}

export function Card({
  children,
  enableSpotlight = true,
  className = "",
  ...props
}: CardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableSpotlight || !divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (!enableSpotlight) return;
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (!enableSpotlight) return;
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900/60 backdrop-blur-xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.12)] ${className}`}
      {...props}
    >
      {enableSpotlight && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16, 185, 129, 0.08), transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
