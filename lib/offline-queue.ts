import AsyncStorage from "@react-native-async-storage/async-storage";

export type QueuedAction = 
  | { type: "bump_item"; itemId: string }
  | { type: "fire_course"; tableGroupId: string; courseNumber: number }
  | { type: "mark_course_served"; courseId: string }
  | { type: "mark_course_plated"; courseId: string };

const QUEUE_KEY = "kds_offline_queue";
const SYNC_STATUS_KEY = "kds_sync_status";

export const offlineQueue = {
  async addAction(action: QueuedAction): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push({
        ...action,
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random()}`,
      });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Error adding to offline queue:", error);
    }
  },

  async getQueue(): Promise<(QueuedAction & { timestamp: number; id: string })[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error retrieving offline queue:", error);
      return [];
    }
  },

  async removeAction(actionId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((action: any) => action.id !== actionId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing from offline queue:", error);
    }
  },

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error("Error clearing offline queue:", error);
    }
  },

  async setSyncStatus(status: "synced" | "syncing" | "error"): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_STATUS_KEY, status);
    } catch (error) {
      console.error("Error setting sync status:", error);
    }
  },

  async getSyncStatus(): Promise<"synced" | "syncing" | "error" | null> {
    try {
      const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      return (status as any) || null;
    } catch (error) {
      console.error("Error getting sync status:", error);
      return null;
    }
  },

  async processQueue(
    handler: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ successful: number; failed: number }> {
    const queue = await this.getQueue();
    let successful = 0;
    let failed = 0;

    for (const queuedAction of queue) {
      try {
        const success = await handler(queuedAction);
        if (success) {
          await this.removeAction(queuedAction.id);
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Error processing queued action:", error);
        failed++;
      }
    }

    return { successful, failed };
  },
};

// Hook for monitoring sync status
export function useSyncStatus() {
  const [status, setStatus] = React.useState<"synced" | "syncing" | "error" | null>(null);
  const [queueLength, setQueueLength] = React.useState(0);

  React.useEffect(() => {
    const checkStatus = async () => {
      const syncStatus = await offlineQueue.getSyncStatus();
      const queue = await offlineQueue.getQueue();
      setStatus(syncStatus);
      setQueueLength(queue.length);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { status, queueLength };
}

import React from "react";
