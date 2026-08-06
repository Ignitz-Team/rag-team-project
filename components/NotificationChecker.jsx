"use client";

import { useEffect } from "react";

export default function NotificationChecker() {

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const saved = JSON.parse(localStorage.getItem("reminders") || "[]");
      const now = Date.now();
      let changed = false;

      const updated = saved.map((r) => {
        if (!r.notified && new Date(r.time).getTime() <= now) {

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("Reminder", { body: r.title });
            } catch (err) {
              console.warn("Browser Notification blocked:", err);
            }
          }

          window.dispatchEvent(
            new CustomEvent("app-notification", {
              detail: { title: "Reminder", body: r.title },
            })
          );

          const history = JSON.parse(localStorage.getItem("notificationHistory") || "[]");
          const entry = {
            id: Date.now(),
            message: r.title,
            time: new Date().toISOString(),
            read: false, // stays unread until user opens Notifications page
          };
          localStorage.setItem("notificationHistory", JSON.stringify([entry, ...history]));

          changed = true;
          return { ...r, notified: true };
        }
        return r;
      });

      if (changed) {
        localStorage.setItem("reminders", JSON.stringify(updated));
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, []);

  return null;
}