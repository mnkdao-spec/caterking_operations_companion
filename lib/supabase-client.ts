import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Check if Supabase credentials are provided
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Create a real Supabase client if credentials are provided
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// Export the client (will be null if not configured)
export const supabase = supabaseClient;

// Helper function to check if operations should use mock data
export function useMockData(): boolean {
  return !isSupabaseConfigured;
}

// Log configuration status (only in development)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  if (isSupabaseConfigured) {
    console.log("[Supabase] ✓ Configured with real credentials");
  } else {
    console.log("[Supabase] ⚠ Not configured - using mock data mode");
    console.log("[Supabase] Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to enable backend");
  }
}
