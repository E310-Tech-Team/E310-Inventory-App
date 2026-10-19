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
        className={`relative w-full ${sizeClasses[size]} rounded-2xl border border-white/[0.08] bg-neutral-900/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-2xl overflow-hidden modal-panel z-10 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.08] bg-neutral-950/40">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors pressable"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
