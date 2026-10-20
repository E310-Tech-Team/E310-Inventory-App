import React from "react";

interface E310LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

export function E310Logo({
  className = "",
  size = "md",
  showWordmark = true,
}: E310LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-8 h-8",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Monogram */}
      <div
        className={`flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-100 font-mono font-bold text-xs ${iconSizes[size]}`}
      >
        E
      </div>

      {showWordmark && (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            E310
          </span>
          <span className="text-[11px] text-zinc-400 font-normal">
            Inventory
          </span>
        </div>
      )}
    </div>
  );
}
