"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Check if already installed as standalone app
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as unknown as { standalone: boolean }).standalone));

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed prompt recently (within 7 days)
    const dismissedAt = localStorage.getItem("e310-pwa-install-dismissed");
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return;
      }
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIOS(isIosDevice);

    // 4. Capture native beforeinstallprompt event (Chromium, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If on iOS and not standalone, show prompt after 3s delay
    let iosTimer: NodeJS.Timeout | null = null;
    if (isIosDevice) {
      iosTimer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsVisible(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  }

  function handleDismiss() {
    setIsVisible(false);
    setShowIOSInstructions(false);
    localStorage.setItem("e310-pwa-install-dismissed", Date.now().toString());
  }

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Install E310 Inventory App"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-surface/95 dark:bg-neutral-900/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 text-foreground transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm leading-tight">Install E310 Inventory</h4>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent">
                  <Sparkles className="w-2.5 h-2.5" /> PWA
                </span>
              </div>
              <p className="text-xs text-muted mt-1 leading-normal">
                Install as a standalone app for instant launch, badge notifications, and offline access.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIOSInstructions ? (
          <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs space-y-2 border border-border">
            <p className="font-semibold text-foreground">How to install on iPhone / iPad:</p>
            <div className="flex items-center gap-2 text-muted">
              <span className="w-5 h-5 rounded-full bg-surface flex items-center justify-center font-bold text-[10px] text-foreground shrink-0 border border-border">
                1
              </span>
              <span>
                Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-accent" /> Share button in Safari.
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <span className="w-5 h-5 rounded-full bg-surface flex items-center justify-center font-bold text-[10px] text-foreground shrink-0 border border-border">
                2
              </span>
              <span>
                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-accent" /> &ldquo;Add to Home Screen&rdquo;.
              </span>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="mt-2 text-[11px] text-accent font-semibold hover:underline block text-right w-full"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
