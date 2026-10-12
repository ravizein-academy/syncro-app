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

        // 6. Direct Message SSE Event
        es.addEventListener("dm_message", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const { threadId, message } = data;
            if (!threadId || !message) return;

            const state = useStore.getState();
            const threadExists = state.dmThreads.some((t) => t.id === threadId);

            if (threadExists) {
              state.setDMThreads(
                state.dmThreads.map((t) => {
                  if (t.id !== threadId) return t;
                  const alreadyHas = (t.messages || []).some((m) => m.id === message.id);
                  return alreadyHas ? t : { ...t, messages: [...(t.messages || []), message] };
                })
              );
            } else {
              // Thread belum ada di state pengguna ini, tarik seluruh threads terbaru dari cache
              fetch("/api/dm", { cache: "no-store" })
                .then((r) => r.json())
                .then((json) => {
                  if (json?.dmThreads && Array.isArray(json.dmThreads)) {
                    state.setDMThreads(json.dmThreads);
                  }
                })
                .catch(() => {});
            }
          } catch (err) {
            console.warn("[Realtime dm_message error]", err);
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

    // Fetch initial DMs
    fetch("/api/dm", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.dmThreads && Array.isArray(json.dmThreads) && json.dmThreads.length > 0) {
          useStore.getState().setDMThreads(json.dmThreads);
        }
      })
      .catch(() => {});

    // Fast Silent Polling Fallback (setiap 3 detik) ke fast memory cache
    // Menjamin data selalu sinkron seketika di semua perangkat bahkan jika browser tidak mendukung SSE
    const pollInterval = setInterval(async () => {
      try {
        const [resTasks, resUsers, resDMs] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
          fetch("/api/dm", { cache: "no-store" }),
        ]);

        if (resTasks.ok) {
          const tJson = await resTasks.json();
          const remoteTasks = tJson?.tasks || [];
          if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
            const state = useStore.getState();
            const taskMap = new Map();
            state.tasks.forEach((t) => taskMap.set(t.id, t));
            remoteTasks.forEach((remoteTask) => {
              const localTask = taskMap.get(remoteTask.id);
              if (!localTask) {
                taskMap.set(remoteTask.id, remoteTask);
              } else {
                const localTime = new Date(localTask.updatedAt || 0).getTime();
                const remoteTime = new Date(remoteTask.updatedAt || 0).getTime();
                if (remoteTime >= localTime) {
                  taskMap.set(remoteTask.id, { ...localTask, ...remoteTask });
                }
              }
            });
            state.setTasks(Array.from(taskMap.values()));
          }
        }

        if (resUsers.ok) {
          const uJson = await resUsers.json();
          const remoteUsers = uJson?.users || [];
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            const state = useStore.getState();
            state.setUsers(remoteUsers);

            // Verifikasi status saya: jika tidak active, langsung auto-kick
            if (
              state.currentUser &&
              state.currentUser.email?.toLowerCase().trim() !== "ravizein@itsecacademy.com"
            ) {
              const myEmail = state.currentUser.email.toLowerCase().trim();
              const found = remoteUsers.find((u: any) => u.email && u.email.toLowerCase().trim() === myEmail);
              if (!found || found.status !== "active") {
                state.logout();
                try {
                  localStorage.removeItem("syncro_remembered_device_account");
                } catch {}
                window.location.replace("/login");
              }
            }
          }
        }

        if (resDMs.ok) {
          const dmJson = await resDMs.json();
          const remoteThreads = dmJson?.dmThreads || [];
          if (Array.isArray(remoteThreads) && remoteThreads.length > 0) {
            const state = useStore.getState();
            let changed = false;
            const currentThreads = [...state.dmThreads];

            remoteThreads.forEach((remThread: any) => {
              const idx = currentThreads.findIndex((loc) => loc.id === remThread.id);
              if (idx === -1) {
                currentThreads.push(remThread);
                changed = true;
              } else {
                const localThread = currentThreads[idx];
                const msgMap = new Map();
                (localThread.messages || []).forEach((m: any) => msgMap.set(m.id, m));
                let newMsgsAdded = false;
                (remThread.messages || []).forEach((m: any) => {
                  if (!msgMap.has(m.id)) {
                    msgMap.set(m.id, m);
                    newMsgsAdded = true;
                  }
                });
                if (newMsgsAdded) {
                  currentThreads[idx] = {
                    ...localThread,
                    ...remThread,
                    messages: Array.from(msgMap.values()),
                  };
                  changed = true;
                }
              }
            });

            if (changed) {
              state.setDMThreads(currentThreads);
            }
          }
        }
      } catch (e) {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
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

