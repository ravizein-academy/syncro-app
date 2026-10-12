"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import {
  triggerDebouncedAutoSync,
  performAutoCloudSync,
  pullCloudData,
} from "@/lib/sync";

/**
 * AutoSyncProvider
 * Automatically handles:
 * 1. Initial data pull & sync on application startup / login
 * 2. Real-time debounced auto-sync whenever tasks are created, updated, or removed
 * 3. Periodic background synchronization heartbeat (every 60s)
 * 4. Automatic sync when the browser regains online connectivity or tab focus
 */
export function AutoSyncProvider({ children }: { children?: React.ReactNode }) {
  const isAutoSyncEnabled = useStore((s) => s.isAutoSyncEnabled);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isInitialMount = useRef(true);

  // 1. Initial Cloud Pull & Sync on Mount / Login
  useEffect(() => {
    let isMounted = true;

    async function initCloudSync() {
      if (!isAutoSyncEnabled) return;
      try {
        // Step 1: Pull any remote updates from Google Sheets
        await pullCloudData();
        // Step 2: Push current merged state to ensure Google Sheets is synchronized
        if (isMounted) {
          await performAutoCloudSync();
        }
      } catch (err) {
        console.warn("[AutoSyncProvider] Initial sync notice:", err);
      }
    }

    initCloudSync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAutoSyncEnabled]);

  // 2. Subscribe to task changes for automatic debounced saving
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    // Subscribe to store state changes
    const unsubscribe = useStore.subscribe((curr, prev) => {
      // If tasks changed, trigger debounced automatic sync
      if (curr.tasks !== prev.tasks) {
        // Skip firing during the very first render mount
        if (isInitialMount.current) {
          isInitialMount.current = false;
          return;
        }
        triggerDebouncedAutoSync(1500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAutoSyncEnabled]);

  // 3. Periodic Background Sync (every 60 seconds) + Window Online/Focus events
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    // Heartbeat interval every 60s
    const intervalId = setInterval(() => {
      performAutoCloudSync();
    }, 60000);

    // Online event handler
    const handleOnline = () => {
      console.log("[Syncro Auto-Sync] Reconnected to internet, initiating sync...");
      performAutoCloudSync({ force: true });
    };

    // Tab visibility/focus handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performAutoCloudSync();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAutoSyncEnabled]);

  return <>{children}</>;
}
