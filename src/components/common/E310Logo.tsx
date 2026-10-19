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
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-xl tracking-tight",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Hexagonal Vector Monogram */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)]"
        >
          <defs>
            <linearGradient id="e310-grad-1" x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="0.5" stopColor="#059669" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="e310-accent" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6ee7b7" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Outer faceted shield/prism */}
          <path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            fill="url(#e310-grad-1)"
            fillOpacity="0.16"
            stroke="url(#e310-grad-1)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inner geometric 'E' and '310' nodal paths */}
          <path
            d="M17 17H31M17 24H27M17 31H31"
            stroke="url(#e310-accent)"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <path
            d="M17 17V31"
            stroke="url(#e310-accent)"
            strokeWidth="2.75"
            strokeLinecap="round"
          />

          {/* Core hardware node dot */}
          <circle cx="34" cy="24" r="2.5" fill="#38bdf8" />
          <circle cx="34" cy="24" r="4.5" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold font-mono text-white ${textSizes[size]}`}>
              E310
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              R4C
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mt-0.5">
            Hardware Custody
          </span>
        </div>
      )}
    </div>
  );
}
