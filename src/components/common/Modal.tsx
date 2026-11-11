"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen = true,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden modal-panel z-10 flex flex-col max-h-[92dvh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 sm:p-5 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="min-w-0 pr-3">
            <h2
              id="modal-title"
              className="text-base font-bold text-foreground truncate"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5 overflow-y-auto overscroll-contain flex-1 text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
