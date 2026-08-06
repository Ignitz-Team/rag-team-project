"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...e.detail }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    };

    window.addEventListener("app-notification", handler);
    return () => window.removeEventListener("app-notification", handler);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-white border border-blue-200 shadow-2xl rounded-xl p-4 flex items-start gap-3"
        >
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <Bell size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-gray-500 text-sm">{t.body}</p>
          </div>
          <button onClick={() => removeToast(t.id)}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
}