import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Enterprise Priority Icons — Linear / Stripe / GitHub style
 * Clean geometric indicators with precise 1.5px/1.75px strokes.
 * Replaces cartoonish emojis, flames, and lightning bolts.
 */

// Critical / Urgent: Inverted triangle / octagon with crisp exclamation
export function PriorityCriticalIcon({ className = "w-3.5 h-3.5", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7.86 1.5 14.5 13.25H1.22L7.86 1.5Z" />
      <path d="M7.86 5.5v3.5" />
      <circle cx="7.86" cy="11.25" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// High Priority: 3 progressive stacked bars (Linear style)
export function PriorityHighIcon({ className = "w-3.5 h-3.5", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 12h11" />
      <path d="M2.5 8h8" />
      <path d="M2.5 4h5" />
    </svg>
  );
}

// Medium Priority: 2 balanced horizontal bars
export function PriorityMediumIcon({ className = "w-3.5 h-3.5", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 10.5h11" />
      <path d="M2.5 5.5h7" />
    </svg>
  );
}

// Low Priority: 1 minimal base bar
export function PriorityLowIcon({ className = "w-3.5 h-3.5", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 8h5" />
    </svg>
  );
}

// Catalog / Fleet Hardware Icon (Heroicons Server / Microchip style, replaces Sparkles)
export function FleetAssetsIcon({ className = "w-4 h-4", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 20}
      height={size || 20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2.5" y="3.5" width="15" height="5" rx="1.5" />
      <rect x="2.5" y="11.5" width="15" height="5" rx="1.5" />
      <circle cx="6" cy="6" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="6" cy="14" r="0.75" fill="currentColor" stroke="none" />
      <path d="M9 6h5.5" />
      <path d="M9 14h5.5" />
    </svg>
  );
}

// Quick Presets Icon (Heroicons Calendar-Clock style, replaces Sparkles)
export function PresetTimerIcon({ className = "w-3.5 h-3.5", size, ...props }: IconProps) {
  return (
    <svg
      width={size || 16}
      height={size || 16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="2.5" width="12" height="11" rx="2" />
      <path d="M2 6h12" />
      <path d="M5 1.5v2" />
      <path d="M11 1.5v2" />
      <path d="M8 8.5v2l1.5 1" />
    </svg>
  );
}

