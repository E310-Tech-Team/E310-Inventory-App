"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StaffDevice } from "@/types";
import { MyDevicesList } from "@/components/staff/MyDevicesList";
import { Loader2 } from "lucide-react";

interface DevicesViewClientProps {
  initialDevices: StaffDevice[];
}

export function DevicesViewClient({ initialDevices }: DevicesViewClientProps) {
  const [devices, setDevices] = useState<StaffDevice[]>(initialDevices);
  const [loading, setLoading] = useState(false);

  const refreshDevices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/staff/devices");
      if (!res.ok) return;
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.warn("Failed to refresh staff devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-brand-teal bg-surface/90 px-2.5 py-1 rounded-full border border-border shadow-xs backdrop-blur-md z-10">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing devices...</span>
        </div>
      )}
      <MyDevicesList devices={devices} onRefresh={refreshDevices} />
    </div>
  );
}
