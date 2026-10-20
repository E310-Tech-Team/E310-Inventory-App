import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

// Fallback options in case Supabase is unreachable or before migration run
const DEFAULT_DEVICE_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "smartphone", label: "Smartphone / Mobile" },
  { value: "tablet", label: "Tablet" },
  { value: "monitor", label: "Monitor / External Display" },
  { value: "peripheral", label: "Peripheral / Accessory (Keyboard, Mouse)" },
  { value: "av-equipment", label: "Audio / Video Equipment" },
  { value: "network-equipment", label: "Network Equipment" },
  { value: "other", label: "Other Equipment" },
];

const DEFAULT_DEVICE_BRANDS = [
  { value: "apple", label: "Apple" },
  { value: "dell", label: "Dell" },
  { value: "hp", label: "HP" },
  { value: "lenovo", label: "Lenovo" },
  { value: "samsung", label: "Samsung" },
  { value: "logitech", label: "Logitech" },
  { value: "canon", label: "Canon" },
  { value: "other", label: "Other Brand" },
];

const DEFAULT_ISSUE_TYPES = [
  { value: "screen-damage", label: "Screen / Display Damage" },
  { value: "battery-charging", label: "Battery / Charging Issue" },
  { value: "os-boot-failure", label: "Operating System / Boot Failure" },
  { value: "hardware-damage", label: "Physical Hardware Damage" },
  { value: "network-wifi", label: "Network / Wi-Fi Connectivity" },
  { value: "audio-mic", label: "Audio / Microphone / Camera" },
  { value: "software-crash", label: "Software / Application Crash" },
  { value: "other", label: "Other Issue" },
];

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json({
        deviceTypes: DEFAULT_DEVICE_TYPES,
        deviceBrands: DEFAULT_DEVICE_BRANDS,
        issueTypes: DEFAULT_ISSUE_TYPES,
      });
    }

    const supabase = getSupabaseAdminClient();
    const { data: options, error } = await supabase
      .from("portal_options")
      .select("category_group, label, value, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !options || options.length === 0) {
      return NextResponse.json({
        deviceTypes: DEFAULT_DEVICE_TYPES,
        deviceBrands: DEFAULT_DEVICE_BRANDS,
        issueTypes: DEFAULT_ISSUE_TYPES,
      });
    }

    const deviceTypes = options
      .filter((o) => o.category_group === "device_type")
      .map((o) => ({ value: o.value, label: o.label }));

    const deviceBrands = options
      .filter((o) => o.category_group === "device_brand")
      .map((o) => ({ value: o.value, label: o.label }));

    const issueTypes = options
      .filter((o) => o.category_group === "issue_type")
      .map((o) => ({ value: o.value, label: o.label }));

    return NextResponse.json({
      deviceTypes: deviceTypes.length > 0 ? deviceTypes : DEFAULT_DEVICE_TYPES,
      deviceBrands: deviceBrands.length > 0 ? deviceBrands : DEFAULT_DEVICE_BRANDS,
      issueTypes: issueTypes.length > 0 ? issueTypes : DEFAULT_ISSUE_TYPES,
    });
  } catch (err: any) {
    console.error("Failed to load staff options:", err);
    return NextResponse.json({
      deviceTypes: DEFAULT_DEVICE_TYPES,
      deviceBrands: DEFAULT_DEVICE_BRANDS,
      issueTypes: DEFAULT_ISSUE_TYPES,
    });
  }
}
