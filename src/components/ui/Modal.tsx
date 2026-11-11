"use client";

import { X } from "lucide-react";
import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!mounted) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="modal-panel relative z-10 w-full md:max-w-md bg-surface rounded-2xl border border-border/80 shadow-2xl max-h-[86dvh] md:max-h-[88dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/80 bg-surface-elevated/50 shrink-0">
          <h2 id={titleId} className="font-semibold text-sm leading-snug text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pressable rounded-xl p-1.5 -mr-1 text-muted hover:text-foreground hover:bg-surface-hover border border-transparent hover:border-border/70 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
