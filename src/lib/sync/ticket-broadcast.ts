"use client";

export interface TicketSyncPayload {
  ticketId: string;
  status: string;
  timestamp: number;
}

const BROADCAST_CHANNEL_NAME = "e310_ticket_updates";
const STORAGE_SYNC_KEY = "e310_ticket_sync_event";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!channel) {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

/**
 * Broadcast ticket status change across all browser tabs and windows.
 */
export function broadcastTicketUpdate(ticketId: string, status: string): void {
  if (typeof window === "undefined") return;

  const payload: TicketSyncPayload = {
    ticketId,
    status,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel (instant modern tabs communication)
  try {
    const ch = getChannel();
    ch?.postMessage(payload);
  } catch {
    // Ignore
  }

  // 2. Storage event (cross-tab fallback)
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(payload));
  } catch {
    // Ignore
  }

  // 3. In-tab custom DOM event
  try {
    window.dispatchEvent(new CustomEvent("e310_ticket_sync", { detail: payload }));
  } catch {
    // Ignore
  }
}

/**
 * Subscribe to ticket updates from any tab/window.
 * Event-driven via BroadcastChannel, storage events, and in-tab DOM events.
 * Avoids aggressive polling and focus thrashing that causes UI flickering.
 */
export function subscribeToTicketUpdates(
  onUpdate: (payload?: TicketSyncPayload) => void,
  options?: { pollIntervalMs?: number }
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const { pollIntervalMs = 0 } = options || {};

  // BroadcastChannel listener
  const ch = getChannel();
  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === "object") {
      onUpdate(event.data as TicketSyncPayload);
    }
  };
  ch?.addEventListener("message", handleBroadcastMessage);

  // Storage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onUpdate(parsed);
      } catch {
        onUpdate();
      }
    }
  };
  window.addEventListener("storage", handleStorage);

  // In-tab CustomEvent listener
  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent<TicketSyncPayload>;
    onUpdate(custom.detail);
  };
  window.addEventListener("e310_ticket_sync", handleCustomEvent);

  // Optional background safety polling (default disabled to prevent UI glitching)
  let timerId: NodeJS.Timeout | null = null;
  if (pollIntervalMs > 0) {
    timerId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        onUpdate();
      }
    }, pollIntervalMs);
  }

  // Unsubscribe cleanup
  return () => {
    ch?.removeEventListener("message", handleBroadcastMessage);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("e310_ticket_sync", handleCustomEvent);
    if (timerId) clearInterval(timerId);
  };
}
