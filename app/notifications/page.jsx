"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

export default function NotificationsPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notificationHistory") || "[]");
    setHistory(saved);

    // mark everything read now that the user has opened this page
    const marked = saved.map((n) => ({ ...n, read: true }));
    localStorage.setItem("notificationHistory", JSON.stringify(marked));
  }, []);

  const clearAll = () => {
    localStorage.setItem("notificationHistory", "[]");
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="bg-white shadow-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/dashboard"><ArrowLeft className="cursor-pointer hover:text-blue-600" /></Link>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        {history.length > 0 && (
          <button onClick={clearAll} className="text-red-600 text-sm font-medium hover:underline">
            Clear all
          </button>
        )}
      </header>

      <div className="max-w-3xl mx-auto mt-8 px-6 space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Bell size={40} className="mx-auto mb-4" />
            No notifications yet.
          </div>
        ) : (
          history.map((n) => (
            <div key={n.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{n.message}</p>
                <p className="text-sm text-gray-500">{new Date(n.time).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}