"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-0 md:px-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="modal-panel relative w-full md:max-w-md bg-surface rounded-t-2xl md:rounded-2xl border border-border max-h-[90dvh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="font-semibold text-sm truncate pr-3">{title}</h2>
          <button
            onClick={onClose}
            className="pressable p-1 text-muted hover:text-foreground shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">{children}</div>
      </div>
    </div>
  );
}
