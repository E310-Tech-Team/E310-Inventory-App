import { DataStore } from "./types";
import { MockStore } from "./mock-store";
import { SupabaseStore } from "./supabase-store";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const dataStore: DataStore = hasSupabaseConfig()
  ? new SupabaseStore()
  : new MockStore();

export * from "./types";
