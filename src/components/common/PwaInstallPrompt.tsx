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
      className="fixed bottom-4 right-4 z-50 animate-fade-in max-w-sm"
    >
      <div className="bg-zinc-900 border border-zinc-800 shadow-lg rounded-xl p-3.5 text-zinc-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-300">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-xs text-zinc-100">Install E310 Inventory</h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                Install as a standalone app for fast access and offline viewing.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showIOSInstructions ? (
          <div className="mt-3 p-2.5 bg-zinc-800/60 rounded-lg text-xs space-y-1.5 border border-zinc-700/60 text-zinc-300">
            <p className="font-medium text-zinc-200">How to install on iOS:</p>
            <p className="text-zinc-400">1. Tap the Share button in Safari.</p>
            <p className="text-zinc-400">2. Tap &ldquo;Add to Home Screen&rdquo;.</p>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-xs text-zinc-300 hover:text-white font-medium block text-right w-full pt-1"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1"
            >
              Maybe later
            </button>
            <button
              onClick={handleInstallClick}
              className="text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 rounded-md transition-colors"
            >
              Install App
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
