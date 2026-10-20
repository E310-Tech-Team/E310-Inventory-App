import React from "react";

interface E310LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "auto" | "light" | "dark";
  showTag?: boolean;
  tagText?: string;
  priority?: boolean;
}


const HEIGHT_CLASSES: Record<string, string> = {
  xs: "h-6 w-auto",   // 24px
  sm: "h-7 w-auto",   // 28px
  md: "h-8 w-auto",   // 32px
  lg: "h-10 w-auto",  // 40px
  xl: "h-12 w-auto",  // 48px
};

export function E310Logo({
  className = "",
  size = "md",
  variant = "auto",
  showTag = false,
  tagText = "INVENTORY",
}: E310LogoProps) {
  const heightClass = HEIGHT_CLASSES[size] || HEIGHT_CLASSES.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {variant === "light" ? (
        <img
          src="/branding/e310-logo-light.png"
          alt="E310"
          className={`${heightClass} max-w-full object-contain`}
          loading="eager"
          decoding="async"
        />
      ) : variant === "dark" ? (
        <img
          src="/branding/e310-logo-dark.png"
          alt="E310"
          className={`${heightClass} max-w-full object-contain`}
          loading="eager"
          decoding="async"
        />
      ) : (
        <>
          <img
            src="/branding/e310-logo-dark.png"
            alt="E310"
            className={`${heightClass} max-w-full object-contain e310-logo-dark`}
            loading="eager"
            decoding="async"
          />
          <img
            src="/branding/e310-logo-light.png"
            alt="E310"
            className={`${heightClass} max-w-full object-contain e310-logo-light`}
            loading="eager"
            decoding="async"
          />
        </>

      )}

      {showTag && (
        <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-yellow/25 text-brand-navy dark:text-brand-yellow border border-brand-yellow/40 leading-none">
          {tagText}
        </span>
      )}
    </div>
  );
}

