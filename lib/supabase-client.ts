import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Check if Supabase credentials are provided
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Create storage adapter that works for both web and native
const getStorageAdapter = () => {
  // For web, use localStorage (available in browser)
  if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  
  // For native, use AsyncStorage
  return AsyncStorage;
};

// Create a real Supabase client if credentials are provided
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
  // Only initialize client in browser environment (not during SSR)
  if (Platform.OS === "web") {
    // For web, check if we're in a browser before initializing
    if (typeof window !== "undefined") {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          storage: getStorageAdapter(),
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
  } else {
    // For native, initialize immediately
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
}

// Export the client (will be null if not configured or during SSR)
export const supabase = supabaseClient as SupabaseClient;

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
