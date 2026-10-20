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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden modal-panel z-10 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold text-zinc-100"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-zinc-400">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
