import { DataStore } from "./types";
import { SupabaseStore } from "./supabase-store";

export const dataStore: DataStore = new SupabaseStore();

export * from "./types";
