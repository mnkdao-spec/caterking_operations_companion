import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeSubscriptionOptions {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook to subscribe to real-time changes on a Supabase table
 * 
 * @example
 * useRealtimeSubscription({
 *   table: 'clients',
 *   onInsert: (payload) => console.log('New client:', payload.new),
 *   onUpdate: (payload) => console.log('Updated client:', payload.new),
 *   onDelete: (payload) => console.log('Deleted client:', payload.old),
 * });
 */
export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!enabled || !supabase) return;

    let channel: RealtimeChannel;

    try {
      // Create a channel for this table
      channel = supabase
        .channel(`${table}_changes`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`[Realtime] ${table} change:`, payload);

            switch (payload.eventType) {
              case "INSERT":
                onInsert?.(payload);
                break;
              case "UPDATE":
                onUpdate?.(payload);
                break;
              case "DELETE":
                onDelete?.(payload);
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] ${table} subscription status:`, status);
        });
    } catch (error) {
      console.error(`[Realtime] Error subscribing to ${table}:`, error);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log(`[Realtime] Unsubscribing from ${table}`);
        supabase.removeChannel(channel);
      }
    };
  }, [table, onInsert, onUpdate, onDelete, enabled]);
}

/**
 * Hook to subscribe to multiple tables at once
 */
export function useRealtimeSubscriptions(
  subscriptions: UseRealtimeSubscriptionOptions[]
) {
  subscriptions.forEach((sub) => {
    useRealtimeSubscription(sub);
  });
}
