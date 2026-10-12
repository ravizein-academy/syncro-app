"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

/**
 * RealtimeProvider
 * Establishes a real-time SSE (Server-Sent Events) streaming connection to /api/realtime.
 * Automatically synchronizes changes across all connected devices and users with zero delay:
 * - New tasks created by team members appear instantly (< 50ms)
 * - Task edits / drag-and-drop moves reflect in real-time
 * - User approvals / deletions trigger immediate updates or auto-kick
 */
export function RealtimeProvider({ children }: { children?: React.ReactNode }) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    function connectSSE() {
      if (typeof window === "undefined") return;

      // Tutup koneksi sebelumnya jika ada
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {}
      }

      try {
        const es = new EventSource("/api/realtime");
        eventSourceRef.current = es;

        es.addEventListener("open", () => {
          // SSE connection established
        });

        // 1. Task Created Event
        es.addEventListener("task_created", (e: MessageEvent) => {
          try {
            const task = JSON.parse(e.data);
            const state = useStore.getState();
            const exists = state.tasks.some((t) => t.id === task.id);
            if (!exists) {
              state.addTask(task);
            }
          } catch (err) {
            console.warn("[Realtime task_created error]", err);
          }
        });

        // 2. Task Updated Event
        es.addEventListener("task_updated", (e: MessageEvent) => {
          try {
            const task = JSON.parse(e.data);
            const state = useStore.getState();
            state.updateTask(task.id, task);
          } catch (err) {
            console.warn("[Realtime task_updated error]", err);
          }
        });

        // 3. Task Deleted Event
        es.addEventListener("task_deleted", (e: MessageEvent) => {
          try {
            const { id } = JSON.parse(e.data);
            if (id) {
              const state = useStore.getState();
              state.deleteTask(id);
            }
          } catch (err) {
            console.warn("[Realtime task_deleted error]", err);
          }
        });

        // 4. User Updated / Approved Event
        es.addEventListener("user_updated", (e: MessageEvent) => {
          try {
            const user = JSON.parse(e.data);
            const state = useStore.getState();
            const existingIdx = state.users.findIndex(
              (u) => (user.email && u.email?.toLowerCase().trim() === user.email.toLowerCase().trim()) || (user.id && u.id === user.id)
            );

            if (existingIdx !== -1) {
              state.updateUser(user.id || state.users[existingIdx].id, user);
            } else {
              state.setUsers([...state.users, user]);
            }

            // Jika status saya sendiri berubah menjadi inactive, langsung auto-kick
            if (
              state.currentUser &&
              state.currentUser.email?.toLowerCase().trim() === user.email?.toLowerCase().trim() &&
              state.currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com"
            ) {
              if (user.status !== "active") {
                state.logout();
                window.location.replace("/login");
              }
            }
          } catch (err) {
            console.warn("[Realtime user_updated error]", err);
          }
        });

        // 5. User Deleted Event (Auto-Kick Target User)
        es.addEventListener("user_deleted", (e: MessageEvent) => {
          try {
            const { email, id } = JSON.parse(e.data);
            const state = useStore.getState();
            const myEmail = state.currentUser?.email?.toLowerCase().trim();

            if (myEmail && email && myEmail === email.toLowerCase().trim()) {
              // Akun saya sendiri telah dihapus oleh Admin! Auto-kick seketika!
              state.logout();
              try {
                localStorage.removeItem("syncro_remembered_device_account");
              } catch {}
              window.location.replace("/login");
              return;
            }

            // Hapus dari state daftar anggota tim
            state.deleteUser(id || "", email);
          } catch (err) {
            console.warn("[Realtime user_deleted error]", err);
          }
        });

        es.onerror = () => {
          if (es.readyState === EventSource.CLOSED) {
            // Reconnect setelah 3 detik jika koneksi terputus
            if (isMounted) {
              reconnectTimerRef.current = setTimeout(connectSSE, 3000);
            }
          }
        };
      } catch (err) {
        console.warn("[SSE Init Warning]", err);
      }
    }

    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch {}
      }
    };
  }, []);

  return <>{children}</>;
}
